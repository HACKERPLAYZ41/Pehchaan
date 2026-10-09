<?php
declare(strict_types=1);

namespace Pehchaan\Core;

/**
 * Standardized JSON API Response Handler with Strict Security Headers
 */
class Response
{
    private static array $headersSent = [];

    public static function applySecurityHeaders(): void
    {
        $secConfig = require __DIR__ . '/../../config/security.php';
        $headers = $secConfig['headers'] ?? [];

        foreach ($headers as $key => $value) {
            if (!headers_sent()) {
                header("{$key}: {$value}");
            }
        }
    }

    public static function json(
        array $data,
        int $statusCode = 200,
        array $extraHeaders = []
    ): void {
        self::applySecurityHeaders();

        foreach ($extraHeaders as $k => $v) {
            if (!headers_sent()) {
                header("{$k}: {$v}");
            }
        }

        if (!headers_sent()) {
            http_response_code($statusCode);
        }

        $payload = array_merge([
            'success' => ($statusCode >= 200 && $statusCode < 400),
            'status' => $statusCode,
            'timestamp' => date('c'),
        ], $data);

        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function error(
        string $message,
        int $statusCode = 400,
        array $details = []
    ): void {
        $payload = [
            'error' => [
                'message' => $message,
                'code' => $statusCode,
            ]
        ];

        if (!empty($details)) {
            $payload['error']['details'] = $details;
        }

        self::json($payload, $statusCode);
    }
}
