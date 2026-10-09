<?php
declare(strict_types=1);

namespace Pehchaan\Engine;

/**
 * Shingle-Jaccard Text Similarity Analyzer
 * Computes word-level n-gram shingles and Jaccard similarity indices to detect bio / description cloning.
 */
class ShingleJaccard
{
    /**
     * Computes the Jaccard similarity coefficient between two text descriptions using n-gram shingles.
     * Returns float between 0.0 (disjoint) and 1.0 (identical set of shingles).
     */
    public static function similarity(string $text1, string $text2, int $ngramSize = 2): float
    {
        $words1 = Normaliser::extractWords($text1);
        $words2 = Normaliser::extractWords($text2);

        if (empty($words1) || empty($words2)) {
            return 0.0;
        }

        $shingles1 = self::generateShingles($words1, $ngramSize);
        $shingles2 = self::generateShingles($words2, $ngramSize);

        if (empty($shingles1) && empty($shingles2)) {
            return 1.0;
        }
        if (empty($shingles1) || empty($shingles2)) {
            return 0.0;
        }

        $set1 = array_unique($shingles1);
        $set2 = array_unique($shingles2);

        $intersection = count(array_intersect($set1, $set2));
        $union = count(array_unique(array_merge($set1, $set2)));

        if ($union === 0) return 0.0;

        return (float)($intersection / $union);
    }

    /**
     * Generates word n-grams from an array of words.
     */
    private static function generateShingles(array $words, int $n): array
    {
        $count = count($words);
        if ($count < $n) {
            return [implode(' ', $words)];
        }

        $shingles = [];
        for ($i = 0; $i <= $count - $n; $i++) {
            $shingles[] = implode(' ', array_slice($words, $i, $n));
        }

        return $shingles;
    }
}
