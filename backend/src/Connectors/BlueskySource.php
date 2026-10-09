<?php
declare(strict_types=1);

namespace Pehchaan\Connectors;

use Pehchaan\Core\SSRFGuard;
use Pehchaan\Engine\ImageHash;
use Exception;

/**
 * Live Bluesky XRPC Threat Connector
 * Queries public XRPC search endpoint: app.bsky.actor.searchActors
 */
class BlueskySource implements SourceInterface
{
    private const ENDPOINT = 'https://public.api.bsky.app/xrpc/app.bsky.actor.searchActors';

    public function getPlatformName(): string
    {
        return 'bluesky';
    }

    public function search(array $brandProfile): array
    {
        $startTime = microtime(true);
        $brandName = $brandProfile['brand_name'] ?? '';
        $query = urlencode(trim($brandName));
        $url = self::ENDPOINT . "?q={$query}&limit=30";

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
                    'error' => $resp['error'] ?? "HTTP {$resp['status']} received from Bluesky.",
                    'items' => [],
                ];
            }

            $json = json_decode($resp['body'], true);
            $actors = $json['actors'] ?? [];
            $items = [];

            foreach ($actors as $actor) {
                $handle = $actor['handle'] ?? '';
                $displayName = $actor['displayName'] ?? $handle;
                $description = $actor['description'] ?? '';
                $avatarUrl = $actor['avatar'] ?? null;
                $did = $actor['did'] ?? '';

                $avatarDHash = null;
                // Optional avatar download with size limit (max 500KB) for perceptual hashing
                if (!empty($avatarUrl) && filter_var($avatarUrl, FILTER_VALIDATE_URL)) {
                    try {
                        $avatarResp = SSRFGuard::safeGet($avatarUrl, [], 3, 512000);
                        if ($avatarResp['success'] && !empty($avatarResp['body'])) {
                            $gd = @imagecreatefromstring($avatarResp['body']);
                            if ($gd) {
                                $avatarDHash = ImageHash::computeDHash($gd);
                                imagedestroy($gd);
                            }
                        }
                    } catch (Exception $e) {
                        // Fail gracefully on avatar fetch
                    }
                }

                $items[] = [
                    'platform' => $this->getPlatformName(),
                    'external_id' => $handle,
                    'display_name' => $displayName,
                    'target_url' => "https://bsky.app/profile/{$handle}",
                    'avatar_url' => $avatarUrl,
                    'avatar_dhash' => $avatarDHash,
                    'description' => $description,
                    'publisher_developer' => null,
                    'raw_data' => [
                        'did' => $did,
                        'handle' => $handle,
                        'displayName' => $displayName,
                        'description' => $description,
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
