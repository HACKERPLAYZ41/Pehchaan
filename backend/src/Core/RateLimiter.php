<?php
declare(strict_types=1);

namespace Pehchaan\Core;

use PDO;
use Exception;

/**
 * IP & Workspace Sliding Window Rate Limiter
 * Protects APIs against brute-force, scraping, and DoS attacks.
 */
class RateLimiter
{
    private PDO $db;
    private int $maxRequests;
    private int $windowSeconds;

    public function __construct(?PDO $db = null, int $maxRequests = 60, int $windowSeconds = 60)
    {
        $this->db = $db ?? Database::getConnection();
        $this->maxRequests = $maxRequests;
        $this->windowSeconds = $windowSeconds;
    }

    public function isAllowed(string $key): bool
    {
        $now = time();
        $windowStart = $now - $this->windowSeconds;

        try {
            // Delete old expired entries occasionally (1 in 50 requests)
            if (mt_rand(1, 50) === 1) {
                $delStmt = $this->db->prepare("DELETE FROM rate_limits WHERE window_start < :cutoff");
                $delStmt->execute([':cutoff' => $now - ($this->windowSeconds * 2)]);
            }

            // Check existing rate limit record
            $stmt = $this->db->prepare("SELECT hits, window_start FROM rate_limits WHERE rate_key = :k");
            $stmt->execute([':k' => $key]);
            $row = $stmt->fetch();

            if ($row) {
                if ($row['window_start'] > $windowStart) {
                    if ($row['hits'] >= $this->maxRequests) {
                        return false; // Limit exceeded
                    }
                    $updateStmt = $this->db->prepare("UPDATE rate_limits SET hits = hits + 1 WHERE rate_key = :k");
                    $updateStmt->execute([':k' => $key]);
                } else {
                    // Reset window
                    $resetStmt = $this->db->prepare("UPDATE rate_limits SET hits = 1, window_start = :now WHERE rate_key = :k");
                    $resetStmt->execute([':now' => $now, ':k' => $key]);
                }
            } else {
                $insertStmt = $this->db->prepare("INSERT INTO rate_limits (rate_key, hits, window_start) VALUES (:k, 1, :now)");
                $insertStmt->execute([':k' => $key, ':now' => $now]);
            }

            return true;
        } catch (Exception $e) {
            // If table doesn't exist or DB is locked in test mode, fail-open gracefully for normal traffic
            error_log("[RateLimiter Error] " . $e->getMessage());
            return true;
        }
    }
}
