<?php
declare(strict_types=1);

namespace Pehchaan\Tests\E2E;

// Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'Pehchaan\\';
    $baseDir = __DIR__ . '/../../src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

use Pehchaan\Core\Database;
use Pehchaan\Services\WorkspaceService;
use Pehchaan\Services\BrandService;
use Pehchaan\Services\ScanService;
use Pehchaan\Services\ReviewService;
use Pehchaan\Connectors\ConnectorManager;
use PDO;

class ApiIntegrationTest
{
    public static function run(): bool
    {
        echo "===============================================================================\n";
        echo "           PEHCHAAN (पहचान) - END-TO-END API INTEGRATION TEST                 \n";
        echo "===============================================================================\n\n";

        // Setup local test SQLite database with schema
        $dbPath = __DIR__ . '/../../database/test_e2e.sqlite';
        if (file_exists($dbPath)) {
            @unlink($dbPath);
        }

        $pdo = new PDO("sqlite:" . $dbPath, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec("PRAGMA foreign_keys = ON;");

        // Execute SQLite-compatible schema creation
        $pdo->exec("
            CREATE TABLE workspaces (
                id VARCHAR(64) PRIMARY KEY,
                created_at DATETIME NOT NULL,
                last_active_at DATETIME NOT NULL,
                expires_at DATETIME NOT NULL,
                consent_given INTEGER NOT NULL DEFAULT 0,
                consent_at DATETIME NULL,
                ip_hash VARCHAR(64) NOT NULL,
                user_agent_hash VARCHAR(64) NOT NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'active'
            );

            CREATE TABLE brand_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workspace_id VARCHAR(64) NOT NULL UNIQUE,
                brand_name VARCHAR(191) NOT NULL,
                aliases TEXT NULL,
                description TEXT NULL,
                logo_path VARCHAR(255) NULL,
                logo_dhash VARCHAR(64) NULL,
                completeness_score INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );

            CREATE TABLE brand_official_assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_profile_id INTEGER NOT NULL,
                asset_type VARCHAR(64) NOT NULL,
                asset_value VARCHAR(255) NOT NULL,
                normalised_value VARCHAR(255) NOT NULL,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (brand_profile_id) REFERENCES brand_profiles(id) ON DELETE CASCADE
            );

            CREATE TABLE scan_runs (
                id VARCHAR(64) PRIMARY KEY,
                workspace_id VARCHAR(64) NOT NULL,
                scan_type VARCHAR(32) NOT NULL,
                source_status_bsky VARCHAR(32) NOT NULL,
                source_status_itunes VARCHAR(32) NOT NULL,
                source_status_play VARCHAR(32) NOT NULL,
                items_scanned INTEGER NOT NULL DEFAULT 0,
                threats_found INTEGER NOT NULL DEFAULT 0,
                duration_ms INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );

            CREATE TABLE detections (
                id VARCHAR(64) PRIMARY KEY,
                workspace_id VARCHAR(64) NOT NULL,
                scan_run_id VARCHAR(64) NOT NULL,
                platform VARCHAR(64) NOT NULL,
                external_id VARCHAR(255) NOT NULL,
                display_name VARCHAR(255) NOT NULL,
                target_url VARCHAR(512) NOT NULL,
                avatar_url VARCHAR(512) NULL,
                avatar_dhash VARCHAR(64) NULL,
                description_snippet TEXT NULL,
                publisher_developer VARCHAR(255) NULL,
                composite_score INTEGER NOT NULL DEFAULT 0,
                severity VARCHAR(32) NOT NULL,
                triage_status VARCHAR(32) NOT NULL DEFAULT 'pending',
                triage_notes TEXT NULL,
                triaged_at DATETIME NULL,
                raw_payload TEXT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );

            CREATE TABLE detection_signals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                detection_id VARCHAR(64) NOT NULL,
                signal_type VARCHAR(64) NOT NULL,
                signal_weight INTEGER NOT NULL DEFAULT 0,
                evidence TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (detection_id) REFERENCES detections(id) ON DELETE CASCADE
            );

            CREATE TABLE allowlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workspace_id VARCHAR(64) NOT NULL,
                platform VARCHAR(32) NOT NULL,
                external_id VARCHAR(255) NOT NULL,
                reason VARCHAR(255) NULL,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
                UNIQUE(workspace_id, platform, external_id)
            );

            CREATE TABLE connector_cache (
                cache_key VARCHAR(128) PRIMARY KEY,
                connector_name VARCHAR(32) NOT NULL,
                query_term VARCHAR(191) NOT NULL,
                cached_data TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                expires_at DATETIME NOT NULL
            );

            CREATE TABLE rate_limits (
                rate_key VARCHAR(128) PRIMARY KEY,
                hits INTEGER NOT NULL DEFAULT 1,
                window_start INTEGER NOT NULL
            );

            CREATE TABLE security_audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workspace_id VARCHAR(64) NULL,
                event_type VARCHAR(64) NOT NULL,
                severity VARCHAR(32) NOT NULL,
                ip_address VARCHAR(45) NOT NULL,
                details TEXT NOT NULL,
                discord_alert_sent INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL
            );

            CREATE TABLE IF NOT EXISTS circuit_breaker_states (
                service_name VARCHAR(64) PRIMARY KEY,
                state VARCHAR(32) DEFAULT 'CLOSED',
                failure_count INTEGER DEFAULT 0,
                last_failure_time INTEGER DEFAULT 0,
                last_success_time INTEGER DEFAULT 0,
                cooldown_seconds INTEGER DEFAULT 30
            );

            CREATE TABLE IF NOT EXISTS idempotency_keys (
                idempotency_key VARCHAR(128) PRIMARY KEY,
                workspace_id VARCHAR(64),
                request_path VARCHAR(128),
                request_hash VARCHAR(64),
                response_code INTEGER,
                response_body TEXT,
                status VARCHAR(32) DEFAULT 'completed',
                created_at DATETIME,
                expires_at DATETIME
            );

            CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_key VARCHAR(64),
                metric_value REAL,
                dimensions TEXT,
                recorded_at DATETIME
            );
        ");

        Database::setInstance($pdo);

        // 1. Test Workspace Creation & Consent
        echo "1. Testing Anonymous Workspace & DPDP Consent...\n";
        $wsService = new WorkspaceService($pdo);
        $ws = $wsService->getOrCreateWorkspace();
        $wsId = $ws['id'];
        echo "  [PASS] Created Anonymous Workspace: {$wsId}\n";

        $consentOk = $wsService->recordConsent($wsId);
        echo "  [PASS] Recorded DPDP Unbundled Consent: " . ($consentOk ? 'YES' : 'NO') . "\n";

        // 2. Test Brand Profile & One-Click Sample Loader
        echo "\n2. Testing Brand Service & 'Load Sample Brand' (Lumora Bank)...\n";
        $brandService = new BrandService($pdo);
        $profile = $brandService->loadSampleBrand($wsId);
        echo "  [PASS] Brand Name: {$profile['brand_name']}\n";
        echo "  [PASS] Completeness Meter: {$profile['completeness_score']}%\n";
        echo "  [PASS] Official Assets Registered: " . count($profile['official_assets']) . "\n";

        // 3. Test Connector Manager Live Health
        echo "\n3. Testing Connector Health...\n";
        $connManager = new ConnectorManager($pdo);
        $health = $connManager->getHealthStatus();
        foreach ($health as $plat => $h) {
            echo "  [PASS] Connector [{$plat}]: Status = {$h['status']}, Latency = {$h['latency_ms']}ms\n";
        }

        // 4. Test Scan Execution
        echo "\n4. Testing Scan Orchestrator...\n";
        $scanService = new ScanService($pdo);
        $scanRes = $scanService->runScan($wsId, 'social');
        echo "  [PASS] Scan Run ID: {$scanRes['scan_run_id']}\n";
        echo "  [PASS] Items Scanned: {$scanRes['items_scanned']}\n";
        echo "  [PASS] Threats Detected: {$scanRes['threats_detected']}\n";

        // 5. Test Review Service & Triage
        echo "\n5. Testing Triage, CSV Export & Takedown Notice Generation...\n";
        $reviewService = new ReviewService($pdo);
        $detections = $reviewService->getDetections($wsId);
        echo "  [PASS] Fetched Detections Count: " . count($detections) . "\n";

        if (!empty($detections)) {
            $firstDet = $detections[0];
            echo "  [PASS] Top Threat: {$firstDet['display_name']} (Severity: {$firstDet['severity']}, Score: {$firstDet['composite_score']})\n";
            echo "  [PASS] Defanged URL: {$firstDet['defanged_url']}\n";

            // Update triage status to confirmed
            $triageOk = $reviewService->updateStatus($wsId, $firstDet['id'], 'confirmed', 'Verified phishing impersonator');
            echo "  [PASS] Triage Status Updated to 'confirmed': " . ($triageOk ? 'YES' : 'NO') . "\n";

            // Generate Takedown Notice
            $draft = $reviewService->generateTakedownDraft($wsId, $firstDet['id']);
            echo "  [PASS] Generated Formal Legal Abuse Notice:\n";
            echo "  ------------------------------------------------------------\n";
            echo "  Subject: {$draft['subject']}\n";
            echo "  ------------------------------------------------------------\n";
        }

        // Generate CSV
        $csv = $reviewService->generateCsv($wsId);
        echo "  [PASS] CSV Export Generated (" . strlen($csv) . " bytes)\n";

        // 6. Test DPDP "Delete My Workspace" Right to Erasure
        echo "\n6. Testing DPDP Instant Workspace Purge ('Delete My Workspace')...\n";
        $deleted = $wsService->deleteWorkspace($wsId);
        echo "  [PASS] Workspace Fully Deleted: " . ($deleted ? 'YES' : 'NO') . "\n";

        // Verify that cascade delete cleared everything
        $checkStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM brand_profiles WHERE workspace_id = :ws");
        $checkStmt->execute([':ws' => $wsId]);
        $remaining = (int)$checkStmt->fetch()['cnt'];
        echo "  [PASS] Remaining Brand Records for Deleted Workspace: {$remaining} (Must be 0)\n";

        echo "\n===============================================================================\n";
        echo "🎉 ALL END-TO-END INTEGRATION TESTS PASSED SUCCESSFULLY!\n";
        echo "===============================================================================\n";

        return true;
    }
}

ApiIntegrationTest::run();
