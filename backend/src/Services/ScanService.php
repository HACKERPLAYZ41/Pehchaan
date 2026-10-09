<?php
declare(strict_types=1);

namespace Pehchaan\Services;

use Pehchaan\Core\Database;
use Pehchaan\Connectors\ConnectorManager;
use Pehchaan\Engine\DetectionEngine;
use PDO;
use Exception;
use InvalidArgumentException;

/**
 * Live Threat Scan & Triage Orchestrator
 */
class ScanService
{
    private PDO $db;
    private ConnectorManager $connectorManager;
    private BrandService $brandService;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
        $this->connectorManager = new ConnectorManager($this->db);
        $this->brandService = new BrandService($this->db);
    }

    /**
     * Executes a live threat scan across connectors, scores findings, persists results, and alerts Discord.
     */
    public function runScan(string $workspaceId, string $scanType = 'full'): array
    {
        $profile = $this->brandService->getProfile($workspaceId);
        if (!$profile) {
            throw new InvalidArgumentException("No brand profile found for this workspace. Please create one first.");
        }

        $scanRunId = 'scan_' . bin2hex(random_bytes(12));
        $startTime = microtime(true);
        $now = date('Y-m-d H:i:s');

        // 1. Fetch Allowlist
        $allowStmt = $this->db->prepare("SELECT platform, external_id FROM allowlist WHERE workspace_id = :ws");
        $allowStmt->execute([':ws' => $workspaceId]);
        $allowlist = $allowStmt->fetchAll() ?: [];

        // 2. Query Connectors (Live data with resilient fallback)
        $connectorResult = $this->connectorManager->executeScan($profile, $scanType);
        $candidates = $connectorResult['candidates'];
        $statuses = $connectorResult['source_statuses'];

        $threatsCount = 0;
        $detectionsToSave = [];

        // 3. Algorithmic Evaluation
        foreach ($candidates as $cand) {
            $eval = DetectionEngine::evaluate($profile, $cand, $allowlist);

            // If verified official or zero risk, skip saving as threat
            if ($eval['is_official'] || $eval['composite_score'] < 35) {
                continue;
            }

            $detId = 'det_' . bin2hex(random_bytes(12));
            $threatsCount++;

            $detectionsToSave[] = [
                'id' => $detId,
                'workspace_id' => $workspaceId,
                'scan_run_id' => $scanRunId,
                'platform' => $cand['platform'],
                'external_id' => $cand['external_id'],
                'display_name' => $cand['display_name'],
                'target_url' => $cand['target_url'],
                'avatar_url' => $cand['avatar_url'] ?? null,
                'avatar_dhash' => $cand['avatar_dhash'] ?? null,
                'description_snippet' => $cand['description'] ?? '',
                'publisher_developer' => $cand['publisher_developer'] ?? null,
                'composite_score' => $eval['composite_score'],
                'severity' => $eval['severity'],
                'signals' => $eval['signals'],
                'raw_payload' => json_encode($cand['raw_data'] ?? [], JSON_UNESCAPED_UNICODE),
            ];

            // 4. Send Instant Discord Alert for High/Critical Threats
            if (in_array($eval['severity'], ['HIGH', 'CRITICAL'], true)) {
                AlertService::sendThreatAlert(
                    $profile['brand_name'],
                    $cand['platform'],
                    $cand['external_id'],
                    $eval['composite_score'],
                    $eval['severity'],
                    $cand['target_url'],
                    $eval['signals']
                );
            }
        }

        $durationMs = (int)round((microtime(true) - $startTime) * 1000);

        // 5. Persist Scan Run and Detections to Database
        $this->db->beginTransaction();
        try {
            $scanStmt = $this->db->prepare("
                INSERT INTO scan_runs (id, workspace_id, scan_type, source_status_bsky, source_status_itunes, source_status_play, items_scanned, threats_found, duration_ms, created_at)
                VALUES (:id, :ws, :type, :bsky, :itunes, :play, :scanned, :threats, :dur, :now)
            ");
            $scanStmt->execute([
                ':id' => $scanRunId,
                ':ws' => $workspaceId,
                ':type' => $scanType,
                ':bsky' => $statuses['bluesky'] ?? 'unavailable',
                ':itunes' => $statuses['apple_app_store'] ?? 'unavailable',
                ':play' => $statuses['google_play'] ?? 'unavailable',
                ':scanned' => count($candidates),
                ':threats' => $threatsCount,
                ':dur' => $durationMs,
                ':now' => $now,
            ]);

            // Insert detections & signal records
            $detIns = $this->db->prepare("
                INSERT INTO detections (id, workspace_id, scan_run_id, platform, external_id, display_name, target_url, avatar_url, avatar_dhash, description_snippet, publisher_developer, composite_score, severity, triage_status, raw_payload, created_at)
                VALUES (:id, :ws, :scan_id, :plat, :ext_id, :name, :url, :avatar, :dhash, :desc, :dev, :score, :sev, 'pending', :raw, :now)
            ");

            $sigIns = $this->db->prepare("
                INSERT INTO detection_signals (detection_id, signal_type, signal_weight, evidence, created_at)
                VALUES (:did, :type, :weight, :evi, :now)
            ");

            foreach ($detectionsToSave as $d) {
                $detIns->execute([
                    ':id' => $d['id'],
                    ':ws' => $d['workspace_id'],
                    ':scan_id' => $d['scan_run_id'],
                    ':plat' => $d['platform'],
                    ':ext_id' => $d['external_id'],
                    ':name' => $d['display_name'],
                    ':url' => $d['target_url'],
                    ':avatar' => $d['avatar_url'],
                    ':dhash' => $d['avatar_dhash'],
                    ':desc' => $d['description_snippet'],
                    ':dev' => $d['publisher_developer'],
                    ':score' => $d['composite_score'],
                    ':sev' => $d['severity'],
                    ':raw' => $d['raw_payload'],
                    ':now' => $now,
                ]);

                foreach ($d['signals'] as $sig) {
                    $sigIns->execute([
                        ':did' => $d['id'],
                        ':type' => $sig['signal_type'],
                        ':weight' => $sig['signal_weight'],
                        ':evi' => $sig['evidence'],
                        ':now' => $now,
                    ]);
                }
            }

            $this->db->commit();

        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("[Scan Run Save Error] " . $e->getMessage());
        }

        return [
            'scan_run_id' => $scanRunId,
            'scan_type' => $scanType,
            'source_statuses' => $statuses,
            'items_scanned' => count($candidates),
            'threats_detected' => $threatsCount,
            'duration_ms' => $durationMs,
            'detections' => $detectionsToSave,
        ];
    }
}
