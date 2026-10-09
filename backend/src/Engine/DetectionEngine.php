<?php
declare(strict_types=1);

namespace Pehchaan\Engine;

/**
 * Composite Mathematical Detection Engine
 * Integrates homoglyphs, edit distances, token modifiers, perceptual image hashing,
 * and shingle Jaccard to compute risk score, severity, and granular signal evidence.
 */
class DetectionEngine
{
    /**
     * Evaluates a candidate entity against a brand profile.
     */
    public static function evaluate(
        array $brandProfile,
        array $candidate,
        array $allowlist = []
    ): array {
        $brandName = $brandProfile['brand_name'] ?? '';
        $aliases = $brandProfile['aliases'] ?? [];
        $brandDesc = $brandProfile['description'] ?? '';
        $brandLogoDHash = $brandProfile['logo_dhash'] ?? null;
        $officialAssets = $brandProfile['official_assets'] ?? [];

        $candidatePlatform = $candidate['platform'] ?? 'social';
        $candidateId = $candidate['external_id'] ?? ($candidate['handle'] ?? '');
        $candidateName = $candidate['display_name'] ?? $candidateId;
        $candidateDesc = $candidate['description'] ?? ($candidate['bio'] ?? '');
        $candidateDeveloper = $candidate['publisher_developer'] ?? '';
        $candidateAvatarDHash = $candidate['avatar_dhash'] ?? null;

        // 1. Exclusion Check (Official Whitelist & Allowlist)
        $exclusion = ExclusionFilter::isOfficialOrAllowlisted(
            $candidateId,
            $candidatePlatform,
            $officialAssets,
            $allowlist
        );

        if ($exclusion['is_excluded']) {
            return [
                'composite_score' => 0,
                'severity' => 'LOW',
                'is_official' => true,
                'exclusion_reason' => $exclusion['reason'],
                'signals' => [
                    [
                        'signal_type' => 'official_asset_whitelisted',
                        'signal_weight' => 0,
                        'evidence' => "Verified authentic: matches official asset '{$exclusion['matched_asset']}'",
                    ]
                ],
            ];
        }

        $signals = [];
        $rawScore = 0;
        $independentSignalCount = 0;

        $targetNames = array_merge([$brandName], is_array($aliases) ? $aliases : []);

        // 2. Homoglyph & Skeleton Evaluation
        $candIdSkeleton = Normaliser::toSkeleton($candidateId);
        $candNameSkeleton = Normaliser::toSkeleton($candidateName);
        $candIdClean = Normaliser::stripSeparators($candidateId);
        $candNameClean = Normaliser::stripSeparators($candidateName);

        $bestJaro = 0.0;
        $bestDamerau = 999;
        $matchedTarget = $brandName;

        foreach ($targetNames as $target) {
            $targetSkeleton = Normaliser::toSkeleton($target);
            $targetClean = Normaliser::stripSeparators($target);

            // Jaro-Winkler on clean skeleton
            $jwId = StringDistance::jaroWinkler($targetClean, $candIdClean);
            $jwName = StringDistance::jaroWinkler($targetClean, $candNameClean);
            $currentMaxJw = max($jwId, $jwName);

            if ($currentMaxJw > $bestJaro) {
                $bestJaro = $currentMaxJw;
                $matchedTarget = $target;
            }

            // Damerau-Levenshtein
            $dlId = StringDistance::damerauLevenshtein($targetClean, $candIdClean);
            $dlName = StringDistance::damerauLevenshtein($targetClean, $candNameClean);
            $currentMinDl = min($dlId, $dlName);

            if ($currentMinDl < $bestDamerau) {
                $bestDamerau = $currentMinDl;
            }

            // Direct homoglyph skeleton collision (e.g. Cyrillic 'а' replacing Latin 'a')
            if ($targetClean !== $candIdClean && $targetSkeleton === $candIdSkeleton && !empty($targetClean)) {
                $signals[] = [
                    'signal_type' => 'homoglyph_impersonation',
                    'signal_weight' => 45,
                    'evidence' => "Direct Unicode homoglyph substitution detected targeting '{$target}'",
                ];
                $rawScore += 45;
                $independentSignalCount++;
                break;
            }
        }

        // 3. String Edit Distance Signals
        if ($bestJaro >= 0.88 && $bestDamerau <= 3) {
            $weight = ($bestJaro >= 0.95 || $bestDamerau <= 1) ? 35 : 25;
            $signals[] = [
                'signal_type' => 'high_lexical_similarity',
                'signal_weight' => $weight,
                'evidence' => sprintf("Jaro-Winkler similarity of %.2f%% (Damerau distance: %d) against '%s'", $bestJaro * 100, $bestDamerau, $matchedTarget),
            ];
            $rawScore += $weight;
            $independentSignalCount++;
        }

        // 4. Token & Phishing Keyword Modifier Analysis
        $tokenAnalysis = TokenAnalyzer::analyzeTokens($brandName, $candidateId . ' ' . $candidateName . ' ' . $candidateDesc);

        if ($tokenAnalysis['brand_contained'] && !empty($tokenAnalysis['detected_modifiers'])) {
            $modNames = array_column($tokenAnalysis['detected_modifiers'], 'modifier');
            $signals[] = [
                'signal_type' => 'phishing_keyword_modifiers',
                'signal_weight' => $tokenAnalysis['total_modifier_weight'],
                'evidence' => "Brand name combined with deceptive terms: [" . implode(', ', $modNames) . "]",
            ];
            $rawScore += $tokenAnalysis['total_modifier_weight'];
            $independentSignalCount++;
        }

        // 5. Perceptual Image dHash Comparison
        if (!empty($brandLogoDHash) && !empty($candidateAvatarDHash)) {
            $dist = ImageHash::hammingDistance($brandLogoDHash, $candidateAvatarDHash);
            if ($dist <= 10) {
                $imgWeight = ($dist <= 4) ? 40 : 25;
                $signals[] = [
                    'signal_type' => 'perceptual_logo_clone',
                    'signal_weight' => $imgWeight,
                    'evidence' => "Visual logo match with Hamming distance of {$dist}/64 (Perceptual similarity: " . round((1 - ($dist / 64)) * 100) . "%)",
                ];
                $rawScore += $imgWeight;
                $independentSignalCount++;
            }
        }

        // 6. Bio / Description Shingle Jaccard Similarity
        if (!empty($brandDesc) && !empty($candidateDesc)) {
            $jaccard = ShingleJaccard::similarity($brandDesc, $candidateDesc, 2);
            if ($jaccard >= 0.35) {
                $jaccardWeight = ($jaccard >= 0.60) ? 35 : 20;
                $signals[] = [
                    'signal_type' => 'description_bio_cloning',
                    'signal_weight' => $jaccardWeight,
                    'evidence' => sprintf("Bio/Description shingle Jaccard overlap of %.1f%% with official profile", $jaccard * 100),
                ];
                $rawScore += $jaccardWeight;
                $independentSignalCount++;
            }
        }

        // 7. Developer / Publisher Mismatch (App Store Specific)
        if (!empty($candidateDeveloper) && in_array($candidatePlatform, ['google_play', 'apple_app_store'], true)) {
            $hasMatchedDev = false;
            foreach ($officialAssets as $asset) {
                if (($asset['asset_type'] ?? '') === 'developer_name') {
                    if (Normaliser::stripSeparators($asset['asset_value']) === Normaliser::stripSeparators($candidateDeveloper)) {
                        $hasMatchedDev = true;
                        break;
                    }
                }
            }

            if (!$hasMatchedDev && ($tokenAnalysis['brand_contained'] || $bestJaro >= 0.85)) {
                $signals[] = [
                    'signal_type' => 'unauthorized_developer_mismatch',
                    'signal_weight' => 30,
                    'evidence' => "App published by non-whitelisted entity: '{$candidateDeveloper}'",
                ];
                $rawScore += 30;
                $independentSignalCount++;
            }
        }

        // 8. False Positive Suppressor: Benign Industry Filtering
        if ($tokenAnalysis['is_benign_industry'] && $independentSignalCount < 2) {
            $rawScore = (int)($rawScore * 0.4); // Suppress generic matching
        }

        $finalScore = min(100, max(0, $rawScore));

        // 9. Severity Determination with Independent Signal Threshold
        // CRITICAL: score >= 80 AND >= 2 independent signals
        // HIGH: score >= 60 AND >= 2 independent signals
        // MEDIUM: score >= 40
        // LOW: score < 40 or single-signal matches
        $severity = 'LOW';
        if ($finalScore >= 80 && $independentSignalCount >= 2) {
            $severity = 'CRITICAL';
        } elseif ($finalScore >= 60 && $independentSignalCount >= 2) {
            $severity = 'HIGH';
        } elseif ($finalScore >= 40) {
            $severity = 'MEDIUM';
        }

        return [
            'composite_score' => $finalScore,
            'severity' => $severity,
            'is_official' => false,
            'independent_signals_count' => $independentSignalCount,
            'signals' => $signals,
        ];
    }
}
