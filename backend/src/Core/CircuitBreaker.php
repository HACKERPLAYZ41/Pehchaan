<?php
declare(strict_types=1);

namespace Pehchaan\Core;

use PDO;
use Exception;

/**
 * Circuit Breaker Pattern (Making APIs Reliable When Things Fail Guide)
 * Prevents cascading service failure by fast-failing external integrations when remote endpoints are unhealthy.
 */
class CircuitBreaker
{
    private PDO $db;
    private int $failureThreshold;
    private int $cooldownSeconds;

    public function __construct(?PDO $db = null, int $failureThreshold = 3, int $cooldownSeconds = 30)
    {
        $this->db = $db ?? Database::getConnection();
        $this->failureThreshold = $failureThreshold;
        $this->cooldownSeconds = $cooldownSeconds;
        $this->ensureTable();
    }

    private function ensureTable(): void
    {
        try {
            $this->db->exec("CREATE TABLE IF NOT EXISTS circuit_breaker_states (
                service_name VARCHAR(64) PRIMARY KEY,
                state VARCHAR(32) DEFAULT 'CLOSED',
                failure_count INTEGER DEFAULT 0,
                last_failure_time INTEGER DEFAULT 0,
                last_success_time INTEGER DEFAULT 0,
                cooldown_seconds INTEGER DEFAULT 30
            );");
        } catch (\Throwable) {}
    }

    public function isAvailable(string $service): bool
    {
        $now = time();
        $stmt = $this->db->prepare("SELECT * FROM circuit_breaker_states WHERE service_name = :s");
        $stmt->execute([':s' => $service]);
        $row = $stmt->fetch();

        if (!$row) {
            return true; // Unknown service, default closed
        }

        $state = $row['state'];
        $lastFailure = (int)$row['last_failure_time'];
        $cooldown = (int)($row['cooldown_seconds'] ?: $this->cooldownSeconds);

        if ($state === 'OPEN') {
            if (($now - $lastFailure) >= $cooldown) {
                // Cooldown elapsed: transition to HALF_OPEN to test a canary probe
                $this->transition($service, 'HALF_OPEN');
                return true;
            }
            return false; // Circuit tripped! Reject call immediately to prevent hung requests
        }

        return true;
    }

    public function recordSuccess(string $service): void
    {
        $now = time();
        $stmt = $this->db->prepare("SELECT service_name FROM circuit_breaker_states WHERE service_name = :s");
        $stmt->execute([':s' => $service]);
        if ($stmt->fetch()) {
            $up = $this->db->prepare("UPDATE circuit_breaker_states SET state = 'CLOSED', failure_count = 0, last_success_time = :now WHERE service_name = :s");
            $up->execute([':now' => $now, ':s' => $service]);
        } else {
            $ins = $this->db->prepare("INSERT INTO circuit_breaker_states (service_name, state, failure_count, last_failure_time, last_success_time, cooldown_seconds) VALUES (:s, 'CLOSED', 0, 0, :now, :cd)");
            $ins->execute([':s' => $service, ':now' => $now, ':cd' => $this->cooldownSeconds]);
        }
    }

    public function recordFailure(string $service): void
    {
        $now = time();
        $stmt = $this->db->prepare("SELECT failure_count FROM circuit_breaker_states WHERE service_name = :s");
        $stmt->execute([':s' => $service]);
        $row = $stmt->fetch();

        $count = ($row ? (int)$row['failure_count'] : 0) + 1;
        $newState = ($count >= $this->failureThreshold) ? 'OPEN' : 'CLOSED';

        if ($row) {
            $up = $this->db->prepare("UPDATE circuit_breaker_states SET state = :st, failure_count = :c, last_failure_time = :now WHERE service_name = :s");
            $up->execute([':st' => $newState, ':c' => $count, ':now' => $now, ':s' => $service]);
        } else {
            $ins = $this->db->prepare("INSERT INTO circuit_breaker_states (service_name, state, failure_count, last_failure_time, last_success_time, cooldown_seconds) VALUES (:s, :st, :c, :now, 0, :cd)");
            $ins->execute([':s' => $service, ':st' => $newState, ':c' => $count, ':now' => $now, ':cd' => $this->cooldownSeconds]);
        }

        if ($newState === 'OPEN') {
            error_log("[CircuitBreaker] Circuit TRIPPED OPEN for external service: {$service}. Fast-failing for {$this->cooldownSeconds}s.");
        }
    }

    private function transition(string $service, string $state): void
    {
        $up = $this->db->prepare("UPDATE circuit_breaker_states SET state = :st WHERE service_name = :s");
        $up->execute([':st' => $state, ':s' => $service]);
    }
}
