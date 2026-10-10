<?php
declare(strict_types=1);

namespace Pehchaan\Core;

use PDO;
use Exception;

/**
 * RED Metrics Collector (Backend Production Monitoring Guide)
 * Computes Rate, Errors, and Duration telemetry for production observability.
 */
class Metrics
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function record(string $metricKey, float $value, array $dimensions = []): void
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO system_metrics (metric_key, metric_value, dimensions, recorded_at)
                VALUES (:k, :v, :dim, :now)
            ");
            $stmt->execute([
                ':k' => $metricKey,
                ':v' => $value,
                ':dim' => json_encode($dimensions, JSON_UNESCAPED_SLASHES),
                ':now' => date('Y-m-d H:i:s'),
            ]);
        } catch (Exception $e) {
            // Fail open for telemetry
        }
    }

    public function getSummary(int $windowMinutes = 60): array
    {
        $cutoff = date('Y-m-d H:i:s', time() - ($windowMinutes * 60));
        try {
            $stmt = $this->db->prepare("
                SELECT metric_key, COUNT(*) as sample_count, AVG(metric_value) as avg_val, MAX(metric_value) as max_val
                FROM system_metrics
                WHERE recorded_at >= :c
                GROUP BY metric_key
            ");
            $stmt->execute([':c' => $cutoff]);
            $rows = $stmt->fetchAll() ?: [];

            $summary = [
                'window_minutes' => $windowMinutes,
                'metrics' => [],
                'system_health' => 'optimal',
            ];

            foreach ($rows as $r) {
                $summary['metrics'][$r['metric_key']] = [
                    'samples' => (int)$r['sample_count'],
                    'average' => round((float)$r['avg_val'], 2),
                    'max' => round((float)$r['max_val'], 2),
                ];
            }

            return $summary;
        } catch (Exception $e) {
            return ['window_minutes' => $windowMinutes, 'metrics' => [], 'error' => $e->getMessage()];
        }
    }
}
