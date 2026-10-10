-- ==============================================================================
-- Pehchaan (पहचान) - Digital Risk Protection Platform
-- Production MySQL Schema (cPanel Compatible)
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Workspaces (Anonymous session lifecycle, 7-day TTL auto-purge)
CREATE TABLE IF NOT EXISTS `workspaces` (
    `id` VARCHAR(64) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_active_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` DATETIME NOT NULL,
    `consent_given` TINYINT(1) NOT NULL DEFAULT 0,
    `consent_at` DATETIME NULL,
    `ip_hash` VARCHAR(64) NOT NULL,
    `user_agent_hash` VARCHAR(64) NOT NULL,
    `status` ENUM('active', 'purged', 'deleted') NOT NULL DEFAULT 'active',
    PRIMARY KEY (`id`),
    INDEX `idx_workspaces_expires` (`expires_at`),
    INDEX `idx_workspaces_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Brand Profiles (Core driving entity for all detection)
CREATE TABLE IF NOT EXISTS `brand_profiles` (
    `id` INT AUTO_INCREMENT NOT NULL,
    `workspace_id` VARCHAR(64) NOT NULL,
    `brand_name` VARCHAR(191) NOT NULL,
    `aliases` TEXT NULL COMMENT 'JSON array of aliases',
    `description` TEXT NULL,
    `logo_path` VARCHAR(255) NULL,
    `logo_dhash` VARCHAR(64) NULL COMMENT '64-bit hexadecimal difference hash',
    `completeness_score` INT NOT NULL DEFAULT 0 COMMENT '0 to 100 percentage',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_workspace_brand` (`workspace_id`),
    CONSTRAINT `fk_brand_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Official Assets Whitelist (Strict exclusion against self-flagging)
CREATE TABLE IF NOT EXISTS `brand_official_assets` (
    `id` INT AUTO_INCREMENT NOT NULL,
    `brand_profile_id` INT NOT NULL,
    `asset_type` ENUM('handle_bsky', 'handle_twitter', 'handle_instagram', 'handle_linkedin', 'app_play_package', 'app_ios_id', 'developer_name', 'domain') NOT NULL,
    `asset_value` VARCHAR(255) NOT NULL,
    `normalised_value` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_brand_asset_lookup` (`brand_profile_id`, `asset_type`, `normalised_value`),
    CONSTRAINT `fk_assets_brand` FOREIGN KEY (`brand_profile_id`) REFERENCES `brand_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Scan Runs (Tracking connector executions & health)
CREATE TABLE IF NOT EXISTS `scan_runs` (
    `id` VARCHAR(64) NOT NULL,
    `workspace_id` VARCHAR(64) NOT NULL,
    `scan_type` ENUM('social', 'apps', 'full') NOT NULL,
    `source_status_bsky` ENUM('live', 'cached', 'unavailable') NOT NULL DEFAULT 'unavailable',
    `source_status_itunes` ENUM('live', 'cached', 'unavailable') NOT NULL DEFAULT 'unavailable',
    `source_status_play` ENUM('live', 'cached', 'unavailable') NOT NULL DEFAULT 'unavailable',
    `items_scanned` INT NOT NULL DEFAULT 0,
    `threats_found` INT NOT NULL DEFAULT 0,
    `duration_ms` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_scan_workspace` (`workspace_id`),
    CONSTRAINT `fk_scan_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Threat Detections (Impersonation findings)
CREATE TABLE IF NOT EXISTS `detections` (
    `id` VARCHAR(64) NOT NULL,
    `workspace_id` VARCHAR(64) NOT NULL,
    `scan_run_id` VARCHAR(64) NOT NULL,
    `platform` ENUM('bluesky', 'twitter', 'google_play', 'apple_app_store', 'domain', 'web') NOT NULL,
    `external_id` VARCHAR(255) NOT NULL COMMENT 'Platform handle, package ID, or numeric ID',
    `display_name` VARCHAR(255) NOT NULL,
    `target_url` VARCHAR(512) NOT NULL,
    `avatar_url` VARCHAR(512) NULL,
    `avatar_dhash` VARCHAR(64) NULL,
    `description_snippet` TEXT NULL,
    `publisher_developer` VARCHAR(255) NULL,
    `composite_score` INT NOT NULL DEFAULT 0 COMMENT '0 to 100 risk score',
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW',
    `triage_status` ENUM('pending', 'confirmed', 'false_positive', 'dismissed') NOT NULL DEFAULT 'pending',
    `triage_notes` TEXT NULL,
    `triaged_at` DATETIME NULL,
    `raw_payload` MEDIUMTEXT NULL COMMENT 'Sanitized raw response JSON',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_det_workspace_status` (`workspace_id`, `triage_status`),
    INDEX `idx_det_severity` (`severity`),
    INDEX `idx_det_platform_ext` (`platform`, `external_id`),
    CONSTRAINT `fk_det_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Detection Signals (Algorithmic evidence breakdown per detection)
CREATE TABLE IF NOT EXISTS `detection_signals` (
    `id` INT AUTO_INCREMENT NOT NULL,
    `detection_id` VARCHAR(64) NOT NULL,
    `signal_type` VARCHAR(64) NOT NULL COMMENT 'e.g. homoglyph_skeleton, jaro_winkler, token_addition, dhash_match, shingle_jaccard, publisher_mismatch',
    `signal_weight` INT NOT NULL DEFAULT 0,
    `evidence` TEXT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_sig_detection` (`detection_id`),
    CONSTRAINT `fk_sig_detection` FOREIGN KEY (`detection_id`) REFERENCES `detections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Allowlist / False Positive Cache
CREATE TABLE IF NOT EXISTS `allowlist` (
    `id` INT AUTO_INCREMENT NOT NULL,
    `workspace_id` VARCHAR(64) NOT NULL,
    `platform` VARCHAR(32) NOT NULL,
    `external_id` VARCHAR(255) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_allowlist_entry` (`workspace_id`, `platform`, `external_id`),
    CONSTRAINT `fk_allow_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Rate Limiting Table
CREATE TABLE IF NOT EXISTS `rate_limits` (
    `rate_key` VARCHAR(128) NOT NULL,
    `hits` INT NOT NULL DEFAULT 1,
    `window_start` INT NOT NULL,
    PRIMARY KEY (`rate_key`),
    INDEX `idx_rate_window` (`window_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Connector Cache (Last good result store for resilient fallback)
CREATE TABLE IF NOT EXISTS `connector_cache` (
    `cache_key` VARCHAR(128) NOT NULL,
    `connector_name` VARCHAR(32) NOT NULL,
    `query_term` VARCHAR(191) NOT NULL,
    `cached_data` MEDIUMTEXT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` DATETIME NOT NULL,
    PRIMARY KEY (`cache_key`),
    INDEX `idx_conn_cache_query` (`connector_name`, `query_term`),
    INDEX `idx_conn_cache_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Security Audit Log (Alerts, SSRF attempts, Rate-limit violations)
CREATE TABLE IF NOT EXISTS `security_audit_logs` (
    `id` INT AUTO_INCREMENT NOT NULL,
    `workspace_id` VARCHAR(64) NULL,
    `event_type` VARCHAR(64) NOT NULL,
    `severity` ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'INFO',
    `ip_address` VARCHAR(45) NOT NULL,
    `details` TEXT NOT NULL,
    `discord_alert_sent` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_sec_event_time` (`event_type`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Idempotency Keys (Prevent Duplicate Mutations & Double Execution)
CREATE TABLE IF NOT EXISTS `idempotency_keys` (
    `idempotency_key` VARCHAR(128) NOT NULL,
    `workspace_id` VARCHAR(64) NOT NULL,
    `request_path` VARCHAR(128) NOT NULL,
    `request_hash` VARCHAR(64) NOT NULL,
    `response_code` INT NOT NULL,
    `response_body` MEDIUMTEXT NOT NULL,
    `status` ENUM('processing', 'completed') NOT NULL DEFAULT 'completed',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` DATETIME NOT NULL,
    PRIMARY KEY (`idempotency_key`),
    INDEX `idx_idem_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Circuit Breaker States (External API Resilience & Graceful Degradation)
CREATE TABLE IF NOT EXISTS `circuit_breaker_states` (
    `service_name` VARCHAR(64) NOT NULL,
    `state` ENUM('CLOSED', 'OPEN', 'HALF_OPEN') NOT NULL DEFAULT 'CLOSED',
    `failure_count` INT NOT NULL DEFAULT 0,
    `last_failure_time` INT NOT NULL DEFAULT 0,
    `last_success_time` INT NOT NULL DEFAULT 0,
    `cooldown_seconds` INT NOT NULL DEFAULT 30,
    PRIMARY KEY (`service_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. System RED Metrics (Production Telemetry & Observability)
CREATE TABLE IF NOT EXISTS `system_metrics` (
    `id` INT AUTO_INCREMENT NOT NULL,
    `metric_key` VARCHAR(64) NOT NULL,
    `metric_value` REAL NOT NULL,
    `dimensions` TEXT NULL,
    `recorded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_metrics_key_time` (`metric_key`, `recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
