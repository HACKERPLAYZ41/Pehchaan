<?php
declare(strict_types=1);

namespace Pehchaan\Engine;

use InvalidArgumentException;

/**
 * 64-bit Perceptual Difference Hash (dHash) & Hamming Distance Computer
 * Detects visual logo clones, resized avatars, and watermark-altered brand icons.
 */
class ImageHash
{
    /**
     * Computes a 64-bit hexadecimal Difference Hash (dHash) from a GD image resource or image path.
     */
    public static function computeDHash($imageInput): ?string
    {
        $gd = null;

        if (is_resource($imageInput) || (is_object($imageInput) && get_class($imageInput) === 'GdImage')) {
            $gd = $imageInput;
        } elseif (is_string($imageInput)) {
            if (!file_exists($imageInput)) {
                return null;
            }
            $data = @file_get_contents($imageInput);
            if (!$data) return null;
            $gd = @imagecreatefromstring($data);
        }

        if (!$gd) {
            return null;
        }

        // 1. Resize to 9x8 pixels (72 pixels total)
        $targetW = 9;
        $targetH = 8;
        $resized = imagecreatetruecolor($targetW, $targetH);
        
        // Preserve alpha if transparent
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        
        imagecopyresampled($resized, $gd, 0, 0, 0, 0, $targetW, $targetH, imagesx($gd), imagesy($gd));

        // 2. Grayscale intensity conversion & adjacent column difference
        $bits = '';
        for ($y = 0; $y < $targetH; $y++) {
            for ($x = 0; $x < 8; $x++) {
                $rgbLeft = imagecolorat($resized, $x, $y);
                $rgbRight = imagecolorat($resized, $x + 1, $y);

                $r1 = ($rgbLeft >> 16) & 0xFF;
                $g1 = ($rgbLeft >> 8) & 0xFF;
                $b1 = $rgbLeft & 0xFF;
                $gray1 = (int)(($r1 * 0.299) + ($g1 * 0.587) + ($b1 * 0.114));

                $r2 = ($rgbRight >> 16) & 0xFF;
                $g2 = ($rgbRight >> 8) & 0xFF;
                $b2 = $rgbRight & 0xFF;
                $gray2 = (int)(($r2 * 0.299) + ($g2 * 0.587) + ($b2 * 0.114));

                $bits .= ($gray1 > $gray2) ? '1' : '0';
            }
        }

        imagedestroy($resized);

        // 3. Convert 64 bits to 16-hex-character string
        $hex = '';
        for ($i = 0; $i < 64; $i += 4) {
            $nibble = substr($bits, $i, 4);
            $hex .= dechex(bindec($nibble));
        }

        return str_pad($hex, 16, '0', STR_PAD_LEFT);
    }

    /**
     * Calculates the Hamming Distance between two 64-bit hexadecimal hashes.
     * Returns an integer from 0 (identical) to 64 (complete inverse).
     * Distances <= 10 typically represent visually similar / cloned logos.
     */
    public static function hammingDistance(?string $hex1, ?string $hex2): int
    {
        if (empty($hex1) || empty($hex2) || strlen($hex1) !== 16 || strlen($hex2) !== 16) {
            return 64; // Maximum divergence
        }

        $bin1 = '';
        $bin2 = '';

        for ($i = 0; $i < 16; $i++) {
            $bin1 .= str_pad(decbin(hexdec($hex1[$i])), 4, '0', STR_PAD_LEFT);
            $bin2 .= str_pad(decbin(hexdec($hex2[$i])), 4, '0', STR_PAD_LEFT);
        }

        $dist = 0;
        for ($i = 0; $i < 64; $i++) {
            if ($bin1[$i] !== $bin2[$i]) {
                $dist++;
            }
        }

        return $dist;
    }
}
