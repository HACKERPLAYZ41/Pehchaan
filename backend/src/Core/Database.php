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
                $dsn = sprintf(
                    "mysql:host=%s;port=%d;dbname=%s;charset=%s",
                    $myConf['host'] ?? '127.0.0.1',
                    $myConf['port'] ?? 3306,
                    $myConf['database'] ?? 'blockcode_pehchaan',
                    $myConf['charset'] ?? 'utf8mb4'
                );
                self::$instance = new PDO(
                    $dsn,
                    $myConf['username'] ?? 'root',
                    $myConf['password'] ?? '',
                    $myConf['options'] ?? []
                );
            }
        } catch (PDOException $e) {
            error_log("[Pehchaan DB Error] " . $e->getMessage());
            // Fallback to SQLite if MySQL is unavailable
            if ($driver !== 'sqlite') {
                error_log("[Pehchaan DB] Falling back to SQLite local database.");
                $dbPath = __DIR__ . '/../../database/pehchaan.sqlite';
                $dir = dirname($dbPath);
                if (!is_dir($dir)) mkdir($dir, 0755, true);
                self::$instance = new PDO("sqlite:" . $dbPath);
                self::$instance->exec("PRAGMA foreign_keys = ON;");
                self::ensureTablesExist(self::$instance);
                return self::$instance;
            }
            throw new RuntimeException("Database connection error. Please verify configuration.", 500, $e);
        }

        return self::$instance;
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
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workspace_id VARCHAR(64),
                scan_type VARCHAR(32),
                status VARCHAR(32),
                threats_found INTEGER DEFAULT 0,
                created_at DATETIME
            );",

            "CREATE TABLE IF NOT EXISTS detections (
                id VARCHAR(64) PRIMARY KEY,
                workspace_id VARCHAR(64),
                platform VARCHAR(64),
                detected_handle TEXT,
                detected_app_name TEXT,
                detected_developer_name TEXT,
                similarity_score REAL,
                severity VARCHAR(32),
                match_type TEXT,
                status VARCHAR(32) DEFAULT 'new',
                triage_status VARCHAR(32) DEFAULT 'new',
                notes TEXT,
                triaged_at DATETIME,
                created_at DATETIME
            );",

            "CREATE TABLE IF NOT EXISTS signals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                detection_id VARCHAR(64),
                signal_type VARCHAR(64),
                signal_value TEXT,
                confidence REAL,
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
