<?php
declare(strict_types=1);

namespace Pehchaan\Engine;

/**
 * Token, Modifier & Phishing Signal Analyzer
 * Identifies high-risk appended/prepended terms (e.g. "support", "helpdesk", "kyc", "airdrop")
 * and filters out benign common dictionary words.
 */
class TokenAnalyzer
{
    /**
     * High-Risk Phishing & Impersonation Modifiers
     */
    private static array $phishingModifiers = [
        // Support / Helpdesk Impersonation
        'support' => 35,
        'helpdesk' => 35,
        'custserv' => 30,
        'care' => 25,
        'helpline' => 30,
        'desk' => 20,
        'service' => 20,
        'services' => 20,
        'agent' => 25,
        'contact' => 20,

        // Authentication & Verification Phishing
        'verify' => 35,
        'verification' => 35,
        'verified' => 30,
        'official' => 30,
        'real' => 25,
        'auth' => 30,
        'login' => 35,
        'signin' => 35,
        'portal' => 25,
        'kyc' => 40,
        'security' => 30,
        'alert' => 25,
        'update' => 25,

        // Financial & Scam Vectors
        'airdrop' => 45,
        'giveaway' => 45,
        'reward' => 35,
        'rewards' => 35,
        'claim' => 35,
        'claims' => 35,
        'refund' => 40,
        'refunds' => 40,
        'bonus' => 35,
        'promo' => 30,
        'wallet' => 30,
        'direct' => 20,
        'bot' => 20,
        'assist' => 25,
    ];

    /**
     * Benign Industry / Generic Category Suffixes that should NOT trigger phishing alarms on their own
     */
    private static array $benignIndustryWords = [
        'foods', 'food', 'restaurant', 'cafe', 'kitchen', 'bakery', 'organics',
        'lighting', 'lights', 'lamps', 'interiors', 'design', 'furniture', 'decor',
        'logistics', 'transport', 'shipping', 'freight', 'cargo', 'courier',
        'apparel', 'clothing', 'fashion', 'wear', 'textiles', 'garments',
        'pharmacy', 'pharma', 'health', 'clinic', 'diagnostics', 'medical',
        'sports', 'fitness', 'gym', 'academy', 'yoga', 'club',
        'realty', 'estates', 'properties', 'builders', 'constructions',
        'energy', 'solar', 'power', 'renewables', 'optics', 'pottery',
    ];

    /**
     * Analyzes suspect tokens against brand name and identifies phishing modifiers.
     */
    public static function analyzeTokens(string $brandName, string $suspectText): array
    {
        $suspectClean = Normaliser::stripSeparators($suspectText);
        $brandWords = Normaliser::extractWords($brandName);
        
        // Extract words splitting on all separators (hyphens, dots, underscores, spaces)
        $cleanText = preg_replace('/[^a-z0-9]/i', ' ', Normaliser::toSkeleton($suspectText, false));
        $suspectWords = preg_split('/\s+/', trim($cleanText), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        $detectedModifiers = [];
        $totalModifierWeight = 0;
        $isBenignIndustry = false;

        // Check for phishing modifiers in suspect words or substrings
        foreach (self::$phishingModifiers as $modifier => $weight) {
            if (in_array($modifier, $suspectWords, true) || str_contains($suspectClean, $modifier)) {
                $detectedModifiers[] = [
                    'modifier' => $modifier,
                    'weight' => $weight,
                ];
                $totalModifierWeight += $weight;
            }
        }

        // Check for benign industry terms
        foreach (self::$benignIndustryWords as $industry) {
            if (in_array($industry, $suspectWords, true) || str_contains($suspectClean, $industry)) {
                $isBenignIndustry = true;
                break;
            }
        }

        // Check for brand name token presence in suspect
        $brandContained = false;
        foreach ($brandWords as $bw) {
            $bwClean = Normaliser::stripSeparators($bw);
            if (mb_strlen($bwClean) >= 3 && (in_array($bwClean, $suspectWords, true) || str_contains($suspectClean, $bwClean))) {
                $brandContained = true;
                break;
            }
        }

        return [
            'brand_contained' => $brandContained,
            'detected_modifiers' => $detectedModifiers,
            'total_modifier_weight' => min(60, $totalModifierWeight),
            'is_benign_industry' => $isBenignIndustry,
            'suspect_words_count' => count($suspectWords),
        ];
    }
}
