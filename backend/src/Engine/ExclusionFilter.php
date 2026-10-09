<?php
declare(strict_types=1);

namespace Pehchaan\Engine;

/**
 * Official Brand Asset Whitelist & Exclusion Filter
 * Guarantees zero false-positives against the brand's genuine official assets.
 */
class ExclusionFilter
{
    /**
     * Checks if a candidate asset matches an official brand asset or allowlisted entry.
     * Returns true if it should be excluded from risk flagging.
     */
    public static function isOfficialOrAllowlisted(
        string $candidateId,
        string $candidatePlatform,
        array $officialAssets,
        array $allowlist = []
    ): array {
        $candidateNorm = Normaliser::stripSeparators($candidateId);

        // 1. Check Allowlist
        foreach ($allowlist as $allowed) {
            $allowedId = is_array($allowed) ? ($allowed['external_id'] ?? '') : (string)$allowed;
            if (Normaliser::stripSeparators($allowedId) === $candidateNorm) {
                return [
                    'is_excluded' => true,
                    'reason' => 'allowlist_matched',
                    'matched_asset' => $allowedId,
                ];
            }
        }

        // 2. Check Official Assets
        foreach ($officialAssets as $asset) {
            $assetValue = is_array($asset) ? ($asset['asset_value'] ?? '') : (string)$asset;
            $assetType = is_array($asset) ? ($asset['asset_type'] ?? '') : '';
            $assetNorm = Normaliser::stripSeparators($assetValue);

            if ($candidateNorm === $assetNorm && !empty($candidateNorm)) {
                return [
                    'is_excluded' => true,
                    'reason' => 'official_asset_exact_match',
                    'matched_asset' => $assetValue,
                    'asset_type' => $assetType,
                ];
            }

            // Domain exact match (subdomain / host comparison)
            if ($candidatePlatform === 'domain' || $assetType === 'domain') {
                $candHost = strtolower(parse_url($candidateId, PHP_URL_HOST) ?: $candidateId);
                $assetHost = strtolower(parse_url($assetValue, PHP_URL_HOST) ?: $assetValue);
                if ($candHost === $assetHost || str_ends_with($candHost, '.' . $assetHost)) {
                    return [
                        'is_excluded' => true,
                        'reason' => 'official_domain_match',
                        'matched_asset' => $assetValue,
                    ];
                }
            }
        }

        return [
            'is_excluded' => false,
            'reason' => null,
            'matched_asset' => null,
        ];
    }
}
