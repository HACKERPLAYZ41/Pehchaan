<?php
declare(strict_types=1);

namespace Pehchaan\Core;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Thread-safe Singleton Database Connection Provider
 * Supports MySQL prepared statements and SQLite for local development.
 */
class Database
{
    private static ?PDO $instance = null;
    private static array $config = [];

    public static function init(array $config): void
    {
        self::$config = $config;
    }

    public static function getConnection(): PDO
    {
        if (self::$instance !== null) {
            return self::$instance;
        }

        if (empty(self::$config)) {
            $configPath = __DIR__ . '/../../config/database.php';
            if (file_exists($configPath)) {
                self::$config = require $configPath;
            } else {
                throw new RuntimeException("Database configuration not loaded.");
            }
        }

        $driver = self::$config['driver'] ?? 'sqlite';

        try {
            if ($driver === 'sqlite') {
                $sqliteConf = self::$config['sqlite'] ?? [];
                $dbPath = $sqliteConf['path'] ?? __DIR__ . '/../../database/pehchaan.sqlite';
                $dir = dirname($dbPath);
                if (!is_dir($dir) && $dbPath !== ':memory:') {
                    mkdir($dir, 0755, true);
                }
                self::$instance = new PDO("sqlite:" . $dbPath, null, null, $sqliteConf['options'] ?? []);
                self::$instance->exec("PRAGMA foreign_keys = ON;");
                self::ensureTablesExist(self::$instance);
            } else {
                $myConf = self::$config['mysql'] ?? [];
                $host = $myConf['host'] ?? '127.0.0.1';
                $port = (int)($myConf['port'] ?? 3306);
                $database = $myConf['database'] ?? 'blockcode_pehchaan';
                $charset = $myConf['charset'] ?? 'utf8mb4';

                $dsn = sprintf("mysql:host=%s;port=%d;dbname=%s;charset=%s", $host, $port, $database, $charset);
                $defaultOptions = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_TIMEOUT => 5,
                ];
                $options = ($myConf['options'] ?? []) + $defaultOptions;

                try {
                    self::$instance = new PDO($dsn, $myConf['username'] ?? 'root', $myConf['password'] ?? '', $options);
                } catch (PDOException $e) {
                    // If connecting via localhost failed (socket issue on cPanel), attempt TCP 127.0.0.1
                    if ($host === 'localhost') {
                        $altDsn = sprintf("mysql:host=127.0.0.1;port=%d;dbname=%s;charset=%s", $port, $database, $charset);
                        self::$instance = new PDO($altDsn, $myConf['username'] ?? 'root', $myConf['password'] ?? '', $options);
                    } else {
                        throw $e;
                    }
                }

                self::ensureMySqlTablesExist(self::$instance);
            }
        } catch (PDOException $e) {
            error_log("[Pehchaan DB Error] " . $e->getMessage());
            // Fallback to SQLite if MySQL is temporarily unreachable
            if ($driver !== 'sqlite') {
                error_log("[Pehchaan DB] Falling back to SQLite local database.");
                $sqliteConf = self::$config['sqlite'] ?? [];
                $dbPath = $sqliteConf['path'] ?? __DIR__ . '/../../database/pehchaan.sqlite';
                $dir = dirname($dbPath);
                if (!is_dir($dir)) mkdir($dir, 0755, true);
                self::$instance = new PDO("sqlite:" . $dbPath, null, null, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
                self::$instance->exec("PRAGMA foreign_keys = ON;");
                self::ensureTablesExist(self::$instance);
                return self::$instance;
            }
            throw new RuntimeException("Database connection error: " . $e->getMessage(), 500, $e);
        }

        return self::$instance;
    }

    private static function ensureMySqlTablesExist(PDO $pdo): void
    {
        try {
            $check = $pdo->query("SHOW TABLES LIKE 'workspaces'");
            $tables = $check ? $check->fetchAll(PDO::FETCH_COLUMN) : [];
            if (empty($tables)) {
                $candidates = [
                    __DIR__ . '/../../database/schema.sql',
                    __DIR__ . '/../database/schema.sql',
                    dirname(__DIR__, 2) . '/database/schema.sql'
                ];
                $schemaFile = null;
                foreach ($candidates as $cand) {
                    if (file_exists($cand)) {
                        $schemaFile = $cand;
                        break;
                    }
                }
                if ($schemaFile) {
                    $sql = file_get_contents($schemaFile);
                    $statements = array_filter(
                        array_map('trim', explode(';', $sql)),
                        fn($stmt) => !empty($stmt)
                    );
                    foreach ($statements as $stmt) {
                        try {
                            $pdo->exec($stmt);
                        } catch (\Throwable $ex) {
                            error_log("[Pehchaan DB Auto-Migrate Statement Warning] " . $ex->getMessage());
                        }
                    }
                    error_log("[Pehchaan DB] Successfully auto-migrated schema.sql to MySQL database.");
                }
            }
        } catch (\Throwable $e) {
            error_log("[Pehchaan DB Auto-Migrate Error] " . $e->getMessage());
        }
    }

    private static function ensureTablesExist(PDO $pdo): void
    {
        $queries = [
            "CREATE TABLE IF NOT EXISTS workspaces (
                id VARCHAR(64) PRIMARY KEY,
                created_at DATETIME,
                last_active_at DATETIME,
                expires_at DATETIME,
                consent_given INTEGER DEFAULT 0,
                consent_at DATETIME,
                ip_hash VARCHAR(64),
                user_agent_hash VARCHAR(64),
                status VARCHAR(32) DEFAULT 'active'
            );",

            "CREATE TABLE IF NOT EXISTS brand_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workspace_id VARCHAR(64),
                brand_name TEXT,
                aliases TEXT,
                description TEXT,
                logo_path TEXT,
                logo_dhash VARCHAR(64),
                completeness_score INTEGER DEFAULT 0,
                created_at DATETIME,
                updated_at DATETIME
            );",

            "CREATE TABLE IF NOT EXISTS brand_official_assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_profile_id INTEGER,
                asset_type VARCHAR(64),
                asset_value TEXT,
                normalised_value TEXT,
                created_at DATETIME
            );",

            "CREATE TABLE IF NOT EXISTS scan_runs (
                id VARCHAR(64) PRIMARY KEY,
                workspace_id VARCHAR(64),
                scan_type VARCHAR(32),
                source_status_bsky VARCHAR(32) DEFAULT 'unavailable',
                source_status_itunes VARCHAR(32) DEFAULT 'unavailable',
                source_status_play VARCHAR(32) DEFAULT 'unavailable',
                items_scanned INTEGER DEFAULT 0,
                threats_found INTEGER DEFAULT 0,
                duration_ms INTEGER DEFAULT 0,
                status VARCHAR(32),
                created_at DATETIME
            );",

            "CREATE TABLE IF NOT EXISTS detections (
                id VARCHAR(64) PRIMARY KEY,
                workspace_id VARCHAR(64),
                scan_run_id VARCHAR(64),
                platform VARCHAR(64),
                external_id TEXT,
                display_name TEXT,
                target_url TEXT,
                avatar_url TEXT,
                avatar_dhash VARCHAR(64),
                description_snippet TEXT,
                publisher_developer TEXT,
                composite_score INTEGER DEFAULT 0,
                detected_handle TEXT,
                detected_app_name TEXT,
                detected_developer_name TEXT,
                similarity_score REAL,
                severity VARCHAR(32),
                match_type TEXT,
                status VARCHAR(32) DEFAULT 'new',
                triage_status VARCHAR(32) DEFAULT 'pending',
                triage_notes TEXT,
                notes TEXT,
                triaged_at DATETIME,
                raw_payload TEXT,
                created_at DATETIME,
                updated_at DATETIME
            );",

            "CREATE TABLE IF NOT EXISTS detection_signals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                detection_id VARCHAR(64),
                signal_type VARCHAR(64),
                signal_weight INTEGER DEFAULT 0,
                evidence TEXT,
                created_at DATETIME
            );",

            "CREATE TABLE IF NOT EXISTS allowlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workspace_id VARCHAR(64),
                platform VARCHAR(32),
                external_id VARCHAR(255),
                reason VARCHAR(255),
                created_at DATETIME
            );",

            "CREATE TABLE IF NOT EXISTS rate_limits (
                rate_key VARCHAR(128) PRIMARY KEY,
                hits INTEGER DEFAULT 1,
                window_start INTEGER
            );",

            "CREATE TABLE IF NOT EXISTS connector_cache (
                cache_key VARCHAR(128) PRIMARY KEY,
                connector_name VARCHAR(32),
                query_term VARCHAR(191),
                cached_data TEXT,
                created_at DATETIME,
                expires_at DATETIME
            );",

            "CREATE TABLE IF NOT EXISTS security_audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workspace_id VARCHAR(64),
                event_type VARCHAR(64),
                severity VARCHAR(32) DEFAULT 'INFO',
                ip_address VARCHAR(45),
                details TEXT,
                discord_alert_sent INTEGER DEFAULT 0,
                created_at DATETIME
            );"
        ];

        foreach ($queries as $sql) {
            $pdo->exec($sql);
        }
    }

    public static function setInstance(?PDO $pdo): void
    {
        self::$instance = $pdo;
    }
}
