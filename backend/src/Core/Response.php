<?php
declare(strict_types=1);

namespace Pehchaan\Core;

/**
 * Standardized JSON API Response Handler with Strict Security Headers
 */
class Response
{
    private static array $headersSent = [];
    private static ?string $activeIdempotencyKey = null;
    private static ?float $requestStartTime = null;

    public static function setContext(?string $idempotencyKey, float $startTime): void
    {
        self::$activeIdempotencyKey = $idempotencyKey;
        self::$requestStartTime = $startTime;
    }

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

        // Calculate and attach duration telemetry
        if (self::$requestStartTime !== null) {
            $durationMs = round((microtime(true) - self::$requestStartTime) * 1000, 2);
            $extraHeaders['X-Response-Time-Ms'] = (string)$durationMs;

            // Structured logging per Backend Production Monitoring Guide
            $logEntry = [
                'type' => 'http_access',
                'timestamp' => date('c'),
                'method' => Request::getMethod(),
                'uri' => Request::getUri(),
                'status' => $statusCode,
                'duration_ms' => $durationMs,
                'ip' => Request::getClientIp(),
            ];
            error_log(json_encode($logEntry, JSON_UNESCAPED_SLASHES));

            // Record RED metrics (Rate, Errors, Duration)
            try {
                $metrics = new Metrics();
                $metrics->record('http_duration_ms', $durationMs, ['method' => Request::getMethod(), 'status' => $statusCode]);
                $metrics->record('http_requests_total', 1.0, ['method' => Request::getMethod(), 'status' => $statusCode]);
                if ($statusCode >= 400) {
                    $metrics->record('http_errors_total', 1.0, ['method' => Request::getMethod(), 'status' => $statusCode]);
                }
            } catch (\Throwable) {}
        }

        foreach ($extraHeaders as $k => $v) {
            if (!headers_sent()) {
                header("{$k}: {$v}");
            }
        }

        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json; charset=utf-8');
        }

        $payload = array_merge([
            'success' => ($statusCode >= 200 && $statusCode < 400),
            'status' => $statusCode,
            'timestamp' => date('c'),
        ], $data);

        // Complete Idempotency key transaction if active and successful
        if (self::$activeIdempotencyKey !== null && $statusCode < 500) {
            try {
                $guard = new IdempotencyGuard();
                $guard->complete(self::$activeIdempotencyKey, $statusCode, $payload);
            } catch (\Throwable) {}
        }

        $jsonStr = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        // Response compression (Production Backend Performance Guide)
        $acceptEncoding = $_SERVER['HTTP_ACCEPT_ENCODING'] ?? '';
        if (str_contains($acceptEncoding, 'gzip') && function_exists('gzencode') && strlen($jsonStr) > 1024) {
            if (!headers_sent()) {
                header('Content-Encoding: gzip');
            }
            echo gzencode($jsonStr, 6);
        } else {
            echo $jsonStr;
        }

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
