<?php
declare(strict_types=1);

namespace Pehchaan\Connectors;

use Pehchaan\Core\SSRFGuard;
use Pehchaan\Engine\ImageHash;
use Exception;

/**
 * Live Apple App Store Threat Connector
 * Queries official Apple iTunes Software Search API
 */
class AppleAppSource implements SourceInterface
{
    private const ENDPOINT = 'https://itunes.apple.com/search';

    public function getPlatformName(): string
    {
        return 'apple_app_store';
    }

    public function search(array $brandProfile): array
    {
        $startTime = microtime(true);
        $brandName = $brandProfile['brand_name'] ?? '';
        $query = urlencode(trim($brandName));
        $url = self::ENDPOINT . "?entity=software&limit=30&term={$query}";

        try {
            $resp = SSRFGuard::safeGet($url, [
                'Accept: application/json',
            ], 8);

            $durationMs = (int)round((microtime(true) - $startTime) * 1000);

            if (!$resp['success'] || empty($resp['body'])) {
                return [
                    'platform' => $this->getPlatformName(),
                    'status' => 'unavailable',
                    'items_count' => 0,
                    'duration_ms' => $durationMs,
                    'error' => $resp['error'] ?? "HTTP {$resp['status']} received from iTunes API.",
                    'items' => [],
                ];
            }

            $json = json_decode($resp['body'], true);
            $results = $json['results'] ?? [];
            $items = [];

            foreach ($results as $app) {
                $trackId = (string)($app['trackId'] ?? '');
                $trackName = $app['trackName'] ?? '';
                $trackUrl = $app['trackViewUrl'] ?? "https://apps.apple.com/app/id{$trackId}";
                $artworkUrl = $app['artworkUrl100'] ?? ($app['artworkUrl512'] ?? ($app['artworkUrl60'] ?? null));
                $description = $app['description'] ?? '';
                $artistName = $app['artistName'] ?? '';
                $bundleId = $app['bundleId'] ?? '';

                $avatarDHash = null;
                if (!empty($artworkUrl) && filter_var($artworkUrl, FILTER_VALIDATE_URL)) {
                    try {
                        $iconResp = SSRFGuard::safeGet($artworkUrl, [], 3, 512000);
                        if ($iconResp['success'] && !empty($iconResp['body'])) {
                            $gd = @imagecreatefromstring($iconResp['body']);
                            if ($gd) {
                                $avatarDHash = ImageHash::computeDHash($gd);
                                imagedestroy($gd);
                            }
                        }
                    } catch (Exception $e) {
                        // Pass gracefully
                    }
                }

                $items[] = [
                    'platform' => $this->getPlatformName(),
                    'external_id' => $trackId,
                    'display_name' => $trackName,
                    'target_url' => $trackUrl,
                    'avatar_url' => $artworkUrl,
                    'avatar_dhash' => $avatarDHash,
                    'description' => $description,
                    'publisher_developer' => $artistName,
                    'raw_data' => [
                        'trackId' => $trackId,
                        'trackName' => $trackName,
                        'bundleId' => $bundleId,
                        'artistName' => $artistName,
                        'version' => $app['version'] ?? '',
                        'price' => $app['price'] ?? 0,
                    ],
                ];
            }

            return [
                'platform' => $this->getPlatformName(),
                'status' => 'live',
                'items_count' => count($items),
                'duration_ms' => $durationMs,
                'error' => null,
                'items' => $items,
            ];

        } catch (Exception $e) {
            $durationMs = (int)round((microtime(true) - $startTime) * 1000);
            return [
                'platform' => $this->getPlatformName(),
                'status' => 'unavailable',
                'items_count' => 0,
                'duration_ms' => $durationMs,
                'error' => $e->getMessage(),
                'items' => [],
            ];
        }
    }
}
