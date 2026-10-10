-- ==============================================================================
-- Pehchaan (पहचान) - Seed Data for Fictional Brand: Lumora Bank
-- ==============================================================================

-- Sample Workspace
INSERT INTO `workspaces` (`id`, `created_at`, `last_active_at`, `expires_at`, `consent_given`, `consent_at`, `ip_hash`, `user_agent_hash`, `status`)
VALUES 
('ws_demo_lumora_bank_001', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 1, NOW(), 'demo_ip_hash', 'demo_ua_hash', 'active')
ON DUPLICATE KEY UPDATE `last_active_at` = NOW();

-- Sample Brand Profile: Lumora Bank
INSERT INTO `brand_profiles` (`id`, `workspace_id`, `brand_name`, `aliases`, `description`, `logo_path`, `logo_dhash`, `completeness_score`, `created_at`)
VALUES 
(1, 'ws_demo_lumora_bank_001', 'Lumora Bank', '["Lumora", "LumoraBank", "Lumora Finance", "Lumora Digital"]', 'Lumora Bank is a next-generation digital financial services institution providing secure savings, instant lending, and corporate payment services.', 'uploads/lumora_official_logo.png', 'f0e0c0800080c0f0', 100, NOW())
ON DUPLICATE KEY UPDATE `completeness_score` = 100;

-- Official Brand Assets (Strict exclusion whitelist)
INSERT INTO `brand_official_assets` (`brand_profile_id`, `asset_type`, `asset_value`, `normalised_value`) VALUES
(1, 'handle_bsky', 'lumorabank.bsky.social', 'lumorabank.bsky.social'),
(1, 'handle_twitter', '@LumoraBank', 'lumorabank'),
(1, 'handle_instagram', 'lumora.official', 'lumoraofficial'),
(1, 'handle_linkedin', 'company/lumora-bank', 'companylumorabank'),
(1, 'app_play_package', 'com.lumora.mobilebank', 'com.lumora.mobilebank'),
(1, 'app_ios_id', '1648291048', '1648291048'),
(1, 'developer_name', 'Lumora Financial Technologies Ltd', 'lumorafinancialtechnologiesltd'),
(1, 'domain', 'lumorabank.com', 'lumorabank.com'),
(1, 'domain', 'lumora.in', 'lumora.in')
ON DUPLICATE KEY UPDATE `normalised_value` = VALUES(`normalised_value`);
