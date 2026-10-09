<?php
declare(strict_types=1);

/**
 * Pehchaan DRP - Security & Privacy Headers Configuration
 * Enforces strict Content Security Policy, Cookie attributes & SSRF IP filters
 */

return [
    'app_env' => getenv('APP_ENV') ?: 'production',
    'app_debug' => filter_var(getenv('APP_DEBUG') ?: false, FILTER_VALIDATE_BOOLEAN),
    'app_url' => getenv('APP_URL') ?: 'https://pehchaan.blockcode.in',
    'app_secret' => getenv('APP_SECRET') ?: 'pehchaan-default-change-me-in-production-secret-key-32b',

    // Rate Limiting Policy
    'rate_limit' => [
        'max_requests' => (int)(getenv('RATE_LIMIT_REQUESTS') ?: 60),
        'window_seconds' => (int)(getenv('RATE_LIMIT_WINDOW_SECONDS') ?: 60),
    ],

    // Data Retention (DPDP Act India 2023)
    'retention' => [
        'workspace_ttl_days' => (int)(getenv('WORKSPACE_TTL_DAYS') ?: 7),
        'dismissed_ttl_days' => (int)(getenv('DISMISSED_TTL_DAYS') ?: 30),
    ],

    // Cookie Security Settings
    'cookie' => [
        'name' => 'pehchaan_ws_token',
        'csrf_name' => 'pehchaan_csrf_token',
        'lifetime' => 7 * 86400,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ],

    // Security Headers
    'headers' => [
        'Content-Type' => 'application/json; charset=utf-8',
        'X-Content-Type-Options' => 'nosniff',
        'X-Frame-Options' => 'DENY',
        'X-XSS-Protection' => '1; mode=block',
        'Referrer-Policy' => 'strict-origin-when-cross-origin',
        'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains; preload',
        'Content-Security-Policy' => "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
        'Permissions-Policy' => 'camera=(), microphone=(), geolocation=(), payment=()',
    ],

    // SSRF Outbound Guard - Blocked CIDRs (IPv4 & IPv6)
    'ssrf_blocked_cidrs' => [
        '0.0.0.0/8',          // Current network (RFC 1122)
        '10.0.0.0/8',         // Private-use networks (RFC 1918)
        '100.64.0.0/10',      // Shared Address Space (RFC 6598)
        '127.0.0.0/8',        // Loopback (RFC 1122)
        '169.254.0.0/16',     // Link Local (RFC 3927) & AWS/Cloud Metadata IP
        '172.16.0.0/12',      // Private-use networks (RFC 1918)
        '192.0.0.0/24',       // IETF Protocol Assignments (RFC 6890)
        '192.0.2.0/24',       // TEST-NET-1 (RFC 5737)
        '192.88.99.0/24',     // 6to4 Relay Anycast (RFC 7526)
        '192.168.0.0/16',     // Private-use networks (RFC 1918)
        '198.18.0.0/15',      // Network Interconnect Device Benchmark Testing (RFC 2544)
        '198.51.100.0/24',    // TEST-NET-2 (RFC 5737)
        '203.0.113.0/24',     // TEST-NET-3 (RFC 5737)
        '224.0.0.0/4',        // Multicast (RFC 5771)
        '240.0.0.0/4',        // Reserved for Future Use (RFC 1112)
        '255.255.255.255/32', // Limited Broadcast (RFC 919)
        '::1/128',            // IPv6 Loopback
        'fc00::/7',           // IPv6 Unique Local Address
        'fe80::/10',          // IPv6 Link-Local
    ],

    // Max Logo Upload constraints
    'logo_upload' => [
        'max_bytes' => 2 * 1024 * 1024, // 2MB
        'allowed_mimes' => ['image/png', 'image/jpeg', 'image/webp'],
        'allowed_extensions' => ['png', 'jpg', 'jpeg', 'webp'],
        'strip_exif' => true,
        'allow_svg' => false, // STRICTLY NO SVG UPLOADS (prevents stored XSS/XML bombs)
    ]
];
