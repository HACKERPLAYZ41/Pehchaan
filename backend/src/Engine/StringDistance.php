<?php
declare(strict_types=1);

namespace Pehchaan\Engine;

/**
 * High-Performance String Distance & Similarity Algorithms
 * Implements Damerau-Levenshtein distance, Jaro-Winkler similarity, and character-level diff markup.
 */
class StringDistance
{
    /**
     * Calculates True Damerau-Levenshtein distance supporting:
     * - Insertions
     * - Deletions
     * - Substitutions
     * - Transpositions of adjacent characters
     */
    public static function damerauLevenshtein(string $s1, string $s2): int
    {
        $len1 = mb_strlen($s1);
        $len2 = mb_strlen($s2);

        if ($len1 === 0) return $len2;
        if ($len2 === 0) return $len1;

        $chars1 = mb_str_split($s1);
        $chars2 = mb_str_split($s2);

        // Infinite distance representation
        $inf = $len1 + $len2;

        // Character dictionary for last seen positions
        $da = [];
        $d = [];

        for ($i = 0; $i <= $len1 + 1; $i++) {
            $d[$i][0] = $inf;
            $d[$i][1] = $i === 0 ? $inf : $i - 1;
        }
        for ($j = 0; $j <= $len2 + 1; $j++) {
            $d[0][$j] = $inf;
            $d[1][$j] = $j === 0 ? $inf : $j - 1;
        }

        for ($i = 1; $i <= $len1; $i++) {
            $db = 0;
            for ($j = 1; $j <= $len2; $j++) {
                $i1 = $da[$chars2[$j - 1]] ?? 0;
                $j1 = $db;
                $cost = ($chars1[$i - 1] === $chars2[$j - 1]) ? 0 : 1;
                if ($cost === 0) $db = $j;

                $d[$i + 1][$j + 1] = min(
                    $d[$i][$j + 1] + 1,                               // Deletion
                    $d[$i + 1][$j] + 1,                               // Insertion
                    $d[$i][$j] + $cost,                               // Substitution
                    $d[$i1][$j1] + ($i - $i1 - 1) + 1 + ($j - $j1 - 1) // Transposition
                );
            }
            $da[$chars1[$i - 1]] = $i;
        }

        return $d[$len1 + 1][$len2 + 1];
    }

    /**
     * Calculates Jaro-Winkler Similarity (0.0 = completely distinct, 1.0 = identical)
     * Includes Winkler prefix bonus up to 4 characters with scale factor p=0.1.
     */
    public static function jaroWinkler(string $s1, string $s2, float $prefixScale = 0.1): float
    {
        $len1 = mb_strlen($s1);
        $len2 = mb_strlen($s2);

        if ($len1 === 0 && $len2 === 0) return 1.0;
        if ($len1 === 0 || $len2 === 0) return 0.0;
        if ($s1 === $s2) return 1.0;

        $chars1 = mb_str_split($s1);
        $chars2 = mb_str_split($s2);

        $matchWindow = (int)max(0, floor(max($len1, $len2) / 2) - 1);

        $s1Matches = array_fill(0, $len1, false);
        $s2Matches = array_fill(0, $len2, false);

        $matches = 0;
        for ($i = 0; $i < $len1; $i++) {
            $start = max(0, $i - $matchWindow);
            $end = min($i + $matchWindow + 1, $len2);

            for ($j = $start; $j < $end; $j++) {
                if ($s2Matches[$j]) continue;
                if ($chars1[$i] !== $chars2[$j]) continue;

                $s1Matches[$i] = true;
                $s2Matches[$j] = true;
                $matches++;
                break;
            }
        }

        if ($matches === 0) return 0.0;

        // Count Transpositions
        $k = 0;
        $transpositions = 0;
        for ($i = 0; $i < $len1; $i++) {
            if (!$s1Matches[$i]) continue;
            while (!$s2Matches[$k]) {
                $k++;
            }
            if ($chars1[$i] !== $chars2[$k]) {
                $transpositions++;
            }
            $k++;
        }

        $transpositions = (int)floor($transpositions / 2);

        // Jaro Distance
        $jaro = (($matches / $len1) + ($matches / $len2) + (($matches - $transpositions) / $matches)) / 3.0;

        // Winkler Prefix Bonus
        $prefix = 0;
        for ($i = 0; $i < min(4, $len1, $len2); $i++) {
            if ($chars1[$i] === $chars2[$i]) {
                $prefix++;
            } else {
                break;
            }
        }

        return $jaro + ($prefix * $prefixScale * (1.0 - $jaro));
    }

    /**
     * Produces character-level difference spans for side-by-side visual comparison in UI.
     * Returns array of tokens: ['type' => 'match'|'added'|'removed'|'substitute', 'char' => string]
     */
    public static function computeCharacterDiff(string $official, string $suspect): array
    {
        $oChars = mb_str_split($official);
        $sChars = mb_str_split($suspect);

        $diff = [];
        $maxLen = max(count($oChars), count($sChars));

        for ($i = 0; $i < $maxLen; $i++) {
            $o = $oChars[$i] ?? null;
            $s = $sChars[$i] ?? null;

            if ($o !== null && $s !== null) {
                if ($o === $s) {
                    $diff[] = ['type' => 'match', 'official' => $o, 'suspect' => $s];
                } else {
                    $diff[] = ['type' => 'substitute', 'official' => $o, 'suspect' => $s];
                }
            } elseif ($o === null && $s !== null) {
                $diff[] = ['type' => 'added', 'official' => '', 'suspect' => $s];
            } elseif ($o !== null && $s === null) {
                $diff[] = ['type' => 'removed', 'official' => $o, 'suspect' => ''];
            }
        }

        return $diff;
    }
}
