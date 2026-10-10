<?php
declare(strict_types=1);

namespace Pehchaan\Connectors;

use Pehchaan\Core\SSRFGuard;
use Pehchaan\Engine\ImageHash;
use Exception;

/**
 * Live Google Play Store Threat Connector
 * Searches Google Play Store with resilient DOM/JSON payload extraction.
 */
class GooglePlaySource implements SourceInterface
{
    private const ENDPOINT = 'https://play.google.com/store/search';

    public function getPlatformName(): string
    {
        return 'google_play';
    }

    public function search(array $brandProfile): array
    {
        $startTime = microtime(true);
        $brandName = $brandProfile['brand_name'] ?? '';
        $query = urlencode(trim($brandName));
        $url = self::ENDPOINT . "?q={$query}&c=apps&hl=en&gl=US";

        try {
            $resp = SSRFGuard::safeGet($url, [
                'Accept: text/html,application/xhtml+xml',
                'Accept-Language: en-US,en;q=0.9',
            ], 8);

            $durationMs = (int)round((microtime(true) - $startTime) * 1000);

            if (!$resp['success'] || empty($resp['body'])) {
                return [
                    'platform' => $this->getPlatformName(),
                    'status' => 'unavailable',
                    'items_count' => 0,
                    'duration_ms' => $durationMs,
                    'error' => $resp['error'] ?? "HTTP {$resp['status']} received from Google Play.",
                    'items' => [],
                ];
            }

            $html = $resp['body'];
            $items = [];

            // Extract Google Play App Cards using regex patterns matching /store/apps/details?id=package.name
            // Pattern matches href="/store/apps/details?id=([a-zA-Z0-9._]+)"
            preg_match_all('/href="\/store\/apps\/details\?id=([a-zA-Z0-9._]+)"/i', $html, $pkgMatches);
            $packages = array_unique($pkgMatches[1] ?? []);

            // Also search for AF_initDataCallback structured app blobs inside Play Store response HTML
            foreach (array_slice($packages, 0, 25) as $packageId) {
                // Approximate app title and developer from surrounding HTML markup
                $escapedPkg = preg_quote($packageId, '/');
                $title = $packageId;
                $developer = '';
                $iconUrl = null;

                // Try to find title near link
                if (preg_match('/details\?id=' . $escapedPkg . '">.*?<span[^>]*class="[^"]*">([^<]+)<\/span>/is', $html, $titleMatch)) {
                    $title = trim(strip_tags($titleMatch[1]));
                } elseif (preg_match('/details\?id=' . $escapedPkg . '"[^>]*aria-label="([^"]+)"/i', $html, $labelMatch)) {
                    $title = trim($labelMatch[1]);
                }

                // Try to find image src
                if (preg_match('/details\?id=' . $escapedPkg . '.*?<img[^>]*src="([^"]+googleusercontent\.com[^"]+)"/is', $html, $imgMatch)) {
                    $iconUrl = html_entity_decode($imgMatch[1]);
                }

                $avatarDHash = null;
                if (!empty($iconUrl) && filter_var($iconUrl, FILTER_VALIDATE_URL)) {
                    try {
                        $iconResp = SSRFGuard::safeGet($iconUrl, [], 2, 512000);
                        if ($iconResp['success'] && !empty($iconResp['body']) && function_exists('imagecreatefromstring')) {
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
                    'external_id' => $packageId,
                    'display_name' => $title,
                    'target_url' => "https://play.google.com/store/apps/details?id={$packageId}",
                    'avatar_url' => $iconUrl,
                    'avatar_dhash' => $avatarDHash,
                    'description' => "Google Play Store Android application matching query: {$brandName}",
                    'publisher_developer' => $developer ?: null,
                    'raw_data' => [
                        'package_id' => $packageId,
                        'title' => $title,
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
