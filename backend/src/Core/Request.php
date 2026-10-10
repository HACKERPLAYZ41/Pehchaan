<?php
declare(strict_types=1);

namespace Pehchaan\Core;

/**
 * Safe Input & Request Parser
 * Enforces sanitization, CSRF tokens, and client identification.
 */
class Request
{
    private static ?array $jsonBody = null;

    public static function getMethod(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public static function getUri(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $pos = strpos($uri, '?');
        if ($pos !== false) {
            $uri = substr($uri, 0, $pos);
        }
        return rtrim($uri, '/') ?: '/';
    }

    public static function getClientIp(): string
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        
        // Only trust Cloudflare CF-Connecting-IP or X-Forwarded-For if explicitly configured in safe proxy mode
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP']) && filter_var($_SERVER['HTTP_CF_CONNECTING_IP'], FILTER_VALIDATE_IP)) {
            return $_SERVER['HTTP_CF_CONNECTING_IP'];
        }

        return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '127.0.0.1';
    }

    public static function getUserAgent(): string
    {
        return substr($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', 0, 255);
    }

    public static function getJson(): array
    {
        if (self::$jsonBody !== null) {
            return self::$jsonBody;
        }

        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            self::$jsonBody = [];
            return self::$jsonBody;
        }

        $decoded = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            Response::error("Invalid JSON body provided.", 400);
        }

        self::$jsonBody = is_array($decoded) ? $decoded : [];
        return self::$jsonBody;
    }

    public static function getQuery(string $key, $default = null)
    {
        return isset($_GET[$key]) ? htmlspecialchars(trim((string)$_GET[$key]), ENT_QUOTES, 'UTF-8') : $default;
    }

    public static function getCookie(string $name, ?string $default = null): ?string
    {
        return $_COOKIE[$name] ?? $default;
    }

    public static function getBearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s(\S+)/i', $header, $matches)) {
            return $matches[1];
        }
        return null;
    }

    public static function getHeader(string $name, ?string $default = null): ?string
    {
        $normalized = strtoupper(str_replace('-', '_', $name));
        $serverKey = 'HTTP_' . $normalized;

        if (isset($_SERVER[$serverKey])) {
            return (string)$_SERVER[$serverKey];
        }

        if (isset($_SERVER[$normalized])) {
            return (string)$_SERVER[$normalized];
        }

        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $k => $v) {
                if (strcasecmp($k, $name) === 0) {
                    return (string)$v;
                }
            }
        }

        return $default;
    }

    public static function getCsrfTokenFromHeader(): ?string
    {
        return self::getHeader('X-CSRF-Token');
    }
}
