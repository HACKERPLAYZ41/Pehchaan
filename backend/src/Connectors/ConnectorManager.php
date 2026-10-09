<?php
declare(strict_types=1);

namespace Pehchaan\Connectors;

use Pehchaan\Core\Database;
use PDO;
use Exception;

/**
 * Orchestrates connector execution, retries, health tracking, and resilient caching.
 */
class ConnectorManager
{
    private PDO $db;
    private array $sources = [];

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
        $this->sources = [
            'bluesky' => new BlueskySource(),
            'apple_app_store' => new AppleAppSource(),
            'google_play' => new GooglePlaySource(),
        ];
    }

    /**
     * Executes scan across requested connectors with caching fallback.
     */
    public function executeScan(array $brandProfile, string $scanType = 'full'): array
    {
        $selectedSources = [];
        if ($scanType === 'social') {
            $selectedSources['bluesky'] = $this->sources['bluesky'];
        } elseif ($scanType === 'apps') {
            $selectedSources['apple_app_store'] = $this->sources['apple_app_store'];
            $selectedSources['google_play'] = $this->sources['google_play'];
        } else {
            $selectedSources = $this->sources;
        }

        $results = [];
        $allItems = [];
        $statuses = [];

        $brandName = $brandProfile['brand_name'] ?? 'default';

        foreach ($selectedSources as $key => $source) {
            $cacheKey = md5("{$key}:{$brandName}");
            
            // 1. Run live search
            $res = $source->search($brandProfile);

            if ($res['status'] === 'live' && !empty($res['items'])) {
                // Save to DB cache
                $this->saveToCache($cacheKey, $key, $brandName, $res['items']);
                $statuses[$key] = 'live';
                $allItems = array_merge($allItems, $res['items']);
            } else {
                // 2. Try Fallback to Cache
                $cachedItems = $this->getFromCache($cacheKey);
                if (!empty($cachedItems)) {
                    $res['status'] = 'cached';
                    $res['items'] = $cachedItems;
                    $res['items_count'] = count($cachedItems);
                    $statuses[$key] = 'cached';
                    $allItems = array_merge($allItems, $cachedItems);
                } else {
                    $statuses[$key] = 'unavailable';
                }
            }

            $results[$key] = $res;
        }

        return [
            'sources' => $results,
            'source_statuses' => $statuses,
            'total_candidates' => count($allItems),
            'candidates' => $allItems,
        ];
    }

    /**
     * Checks health status of all threat connectors.
     */
    public function getHealthStatus(): array
    {
        $health = [];
        $dummyProfile = ['brand_name' => 'Lumora'];

        foreach ($this->sources as $key => $source) {
            $start = microtime(true);
            $res = $source->search($dummyProfile);
            $latency = (int)round((microtime(true) - $start) * 1000);

            $health[$key] = [
                'platform' => $key,
                'status' => $res['status'],
                'latency_ms' => $latency,
                'error' => $res['error'],
                'last_checked_at' => date('c'),
            ];
        }

        return $health;
    }

    private function saveToCache(string $cacheKey, string $connector, string $term, array $items): void
    {
        try {
            $json = json_encode($items, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $expiresAt = date('Y-m-d H:i:s', time() + (6 * 3600)); // 6-hour cache

            $stmt = $this->db->prepare("
                INSERT INTO connector_cache (cache_key, connector_name, query_term, cached_data, expires_at)
                VALUES (:k, :c, :q, :d, :e)
                ON DUPLICATE KEY UPDATE cached_data = :d, expires_at = :e
            ");
            $stmt->execute([
                ':k' => $cacheKey,
                ':c' => $connector,
                ':q' => $term,
                ':d' => $json,
                ':e' => $expiresAt,
            ]);
        } catch (Exception $e) {
            // Fail open if cache table error
        }
    }

    private function getFromCache(string $cacheKey): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT cached_data FROM connector_cache 
                WHERE cache_key = :k AND expires_at > NOW()
            ");
            $stmt->execute([':k' => $cacheKey]);
            $row = $stmt->fetch();
            if ($row && !empty($row['cached_data'])) {
                return json_decode($row['cached_data'], true);
            }
        } catch (Exception $e) {
            return null;
        }
        return null;
    }
}
