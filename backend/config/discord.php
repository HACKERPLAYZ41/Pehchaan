<?php
declare(strict_types=1);

/**
 * Pehchaan DRP - Discord Webhook Alert Configuration
 * Dispatches real-time structured embeds for High/Critical threat detections and security incidents.
 */

$getVal = function (string $key, $default = null) {
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];
    $val = getenv($key);
    return ($val !== false && $val !== '') ? $val : $default;
};

return [
    'enabled' => filter_var($getVal('DISCORD_ALERTS_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
    'webhook_url' => $getVal('DISCORD_WEBHOOK_URL', ''),
    'bot_username' => 'Pehchaan Sentinel',
    'avatar_url' => 'https://pehchaan.blockcode.in/assets/sentinel-avatar.png',
    
    // Severity filters: only dispatch alerts if severity matches or exceeds this level
    'min_severity' => $getVal('DISCORD_MIN_SEVERITY', 'HIGH'),
    
    // Embed Color Palette (Hex integer for Discord Embeds)
    'colors' => [
        'CRITICAL' => 0xD8432B, // Vermilion Risk
        'HIGH'     => 0xE67E22, // Orange Alert
        'MEDIUM'   => 0xF1C40F, // Yellow Caution
        'LOW'      => 0x5B6B4E, // Olive Benign
        'SECURITY' => 0x9B59B6, // Purple Incident
        'INFO'     => 0x3498DB, // Blue System
    ],
    
    // Alert Categories
    'events' => [
        'threat_detected' => true,
        'ssrf_attempt_blocked' => true,
        'rate_limit_exceeded' => true,
        'workspace_purged' => true,
    ]
];
