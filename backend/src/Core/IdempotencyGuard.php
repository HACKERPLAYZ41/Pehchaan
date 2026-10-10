<?php
declare(strict_types=1);

namespace Pehchaan\Core;

use PDO;
use Exception;

/**
 * Idempotency Guard (Preventing Duplicate Actions Guide)
 * Ensures safe client retries and prevents double execution of mutating actions.
 */
class IdempotencyGuard
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    /**
     * Inspects idempotency key status. Returns cached payload or error state.
     */
    public function check(string $key, string $workspaceId, string $path, array $body): ?array
    {
        $now = date('Y-m-d H:i:s');
        $hash = hash('sha256', json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

        // Purge expired keys occasionally (1 in 50)
        if (mt_rand(1, 50) === 1) {
            $del = $this->db->prepare("DELETE FROM idempotency_keys WHERE expires_at < :now");
            $del->execute([':now' => $now]);
        }

        $stmt = $this->db->prepare("SELECT * FROM idempotency_keys WHERE idempotency_key = :k AND expires_at > :now");
        $stmt->execute([':k' => $key, ':now' => $now]);
        $row = $stmt->fetch();

        if (!$row) {
            return null; // Key is new, safe to proceed
        }

        if ($row['status'] === 'processing') {
            return [
                'type' => 'conflict',
                'code' => 409,
                'message' => 'A concurrent request with the same Idempotency-Key is currently processing. Please wait.'
            ];
        }

        if ($row['request_hash'] !== $hash) {
            return [
                'type' => 'mismatch',
                'code' => 422,
                'message' => 'Idempotency key payload mismatch. The same key cannot be used with different request parameters.'
            ];
        }

        return [
            'type' => 'replay',
            'code' => (int)$row['response_code'],
            'body' => json_decode($row['response_body'], true) ?: []
        ];
    }

    /**
     * Acquires lock for processing.
     */
    public function acquire(string $key, string $workspaceId, string $path, array $body): bool
    {
        $now = date('Y-m-d H:i:s');
        $expires = date('Y-m-d H:i:s', time() + 86400); // 24-hour TTL
        $hash = hash('sha256', json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

        try {
            $stmt = $this->db->prepare("
                INSERT INTO idempotency_keys (idempotency_key, workspace_id, request_path, request_hash, response_code, response_body, status, created_at, expires_at)
                VALUES (:k, :ws, :path, :hash, 200, '', 'processing', :now, :exp)
            ");
            return $stmt->execute([
                ':k' => $key,
                ':ws' => $workspaceId,
                ':path' => $path,
                ':hash' => $hash,
                ':now' => $now,
                ':exp' => $expires,
            ]);
        } catch (Exception $e) {
            error_log("[IdempotencyGuard Acquire Error] " . $e->getMessage());
            return false;
        }
    }

    /**
     * Stores final response payload for safe client replay.
     */
    public function complete(string $key, int $code, array $body): void
    {
        try {
            $stmt = $this->db->prepare("
                UPDATE idempotency_keys 
                SET response_code = :code, response_body = :body, status = 'completed'
                WHERE idempotency_key = :k
            ");
            $stmt->execute([
                ':code' => $code,
                ':body' => json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                ':k' => $key,
            ]);
        } catch (Exception $e) {
            error_log("[IdempotencyGuard Complete Error] " . $e->getMessage());
        }
    }
}
