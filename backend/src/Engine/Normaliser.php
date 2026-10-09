<?php
declare(strict_types=1);

namespace Pehchaan\Engine;

use Normalizer;

/**
 * Unicode NFKC & Homoglyph Skeleton Normaliser
 * Eliminates character obfuscation, zero-width spaces, Cyrillic/Greek lookalikes,
 * and punctuation separators to produce a canonical comparison string.
 */
class Normaliser
{
    /**
     * Map of Cyrillic, Greek, Math, and Obfuscated Unicode characters to ASCII equivalents.
     */
    private static array $homoglyphMap = [
        // Cyrillic Lookalikes
        'а' => 'a', 'А' => 'a',
        'в' => 'b', 'В' => 'b',
        'с' => 'c', 'С' => 'c',
        'е' => 'e', 'Е' => 'e', 'ё' => 'e', 'Ё' => 'e',
        'і' => 'i', 'І' => 'i', 'ї' => 'i', 'Ї' => 'i',
        'ј' => 'j', 'Ј' => 'j',
        'к' => 'k', 'К' => 'k',
        'м' => 'm', 'М' => 'm',
        'н' => 'h', 'Н' => 'h',
        'о' => 'o', 'О' => 'o',
        'р' => 'p', 'Р' => 'p',
        'ѕ' => 's', 'Ѕ' => 's',
        'т' => 't', 'Т' => 't',
        'у' => 'y', 'У' => 'y',
        'х' => 'x', 'Х' => 'x',
        'ѵ' => 'v', 'Ѵ' => 'v',
        
        // Greek Lookalikes
        'α' => 'a', 'Α' => 'a',
        'β' => 'b', 'Β' => 'b',
        'γ' => 'y', 'Γ' => 'r',
        'δ' => 'd', 'Δ' => 'd',
        'ε' => 'e', 'Ε' => 'e',
        'η' => 'n', 'Η' => 'h',
        'ι' => 'i', 'Ι' => 'i',
        'κ' => 'k', 'Κ' => 'k',
        'λ' => 'l', 'Λ' => 'l',
        'μ' => 'u', 'Μ' => 'm',
        'ν' => 'v', 'Ν' => 'n',
        'ο' => 'o', 'Ο' => 'o',
        'ρ' => 'p', 'Р' => 'p',
        'τ' => 't', 'Τ' => 't',
        'υ' => 'u', 'Υ' => 'y',
        'χ' => 'x', 'Χ' => 'x',
        'ω' => 'w', 'Ω' => 'w',
    ];

    private static array $leetMap = [
        '0' => 'o',
        '1' => 'l',
        '3' => 'e',
        '4' => 'a',
        '5' => 's',
        '7' => 't',
        '8' => 'b',
        '@' => 'a',
        '$' => 's',
        '!' => 'i',
        '|' => 'l',
    ];

    /**
     * Normalizes a string using Unicode NFKC normalization, homoglyph skeleton transformation,
     * and optional leetspeak conversion.
     */
    public static function toSkeleton(string $input, bool $replaceLeet = false): string
    {
        if (empty($input)) {
            return '';
        }

        // 1. Unicode NFKC normalization
        if (class_exists('Normalizer')) {
            $input = Normalizer::normalize($input, Normalizer::FORM_KC) ?: $input;
        }

        // 2. Remove zero-width spaces, invisible joiners, RTL marks
        $input = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}\x{200E}\x{200F}]/u', '', $input);

        // 3. Lowercase multibyte
        $input = mb_strtolower($input, 'UTF-8');

        // 4. Homoglyph skeleton character substitution
        $chars = mb_str_split($input);
        $result = '';

        foreach ($chars as $char) {
            if ($replaceLeet && isset(self::$leetMap[$char])) {
                $result .= self::$leetMap[$char];
            } elseif (isset(self::$homoglyphMap[$char])) {
                $result .= self::$homoglyphMap[$char];
            } else {
                $result .= $char;
            }
        }

        return $result;
    }

    /**
     * Strips all non-alphanumeric punctuation and separators for deep token comparisons.
     */
    public static function stripSeparators(string $input): string
    {
        $skeleton = self::toSkeleton($input, false);
        return preg_replace('/[^a-z0-9]/', '', $skeleton);
    }

    /**
     * Extracts cleaned alphanumeric words from text.
     */
    public static function extractWords(string $input): array
    {
        $skeleton = self::toSkeleton($input, false);
        $clean = preg_replace('/[^a-z0-9\s]/', ' ', $skeleton);
        $words = preg_split('/\s+/', trim($clean), -1, PREG_SPLIT_NO_EMPTY);
        return $words ?: [];
    }
}
