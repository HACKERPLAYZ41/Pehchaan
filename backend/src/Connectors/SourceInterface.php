<?php
declare(strict_types=1);

namespace Pehchaan\Connectors;

/**
 * Unified Connector Interface for External Threat Sources
 */
interface SourceInterface
{
    /**
     * Search the external platform for candidate entities matching the brand profile.
     * 
     * @param array $brandProfile Brand configuration containing name, aliases, etc.
     * @return array Standardized result:
     * [
     *   'platform' => string ('bluesky' | 'apple_app_store' | 'google_play'),
     *   'status' => string ('live' | 'cached' | 'unavailable'),
     *   'items_count' => int,
     *   'duration_ms' => int,
     *   'error' => ?string,
     *   'items' => array [
     *      [
     *         'platform' => string,
     *         'external_id' => string,
     *         'display_name' => string,
     *         'target_url' => string,
     *         'avatar_url' => ?string,
     *         'avatar_dhash' => ?string,
     *         'description' => string,
     *         'publisher_developer' => ?string,
     *         'raw_data' => array,
     *      ]
     *   ]
     * ]
     */
    public function search(array $brandProfile): array;

    /**
     * Get platform identifier
     */
    public function getPlatformName(): string;
}
