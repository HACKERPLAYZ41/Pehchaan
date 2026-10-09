<?php
declare(strict_types=1);

namespace Pehchaan\Utils;

use InvalidArgumentException;

/**
 * Strict Input Schema & Binary Magic-Byte Validator
 */
class Validator
{
    /**
     * Validates Brand Profile input array
     */
    public static function validateBrandProfile(array $data): array
    {
        $errors = [];

        if (empty($data['brand_name']) || !is_string($data['brand_name'])) {
            $errors['brand_name'] = 'Brand name is required and must be a valid string.';
        } elseif (mb_strlen(trim($data['brand_name'])) < 2 || mb_strlen(trim($data['brand_name'])) > 100) {
            $errors['brand_name'] = 'Brand name must be between 2 and 100 characters.';
        }

        $aliases = [];
        if (!empty($data['aliases'])) {
            if (is_array($data['aliases'])) {
                $aliases = array_values(array_filter(array_map('trim', $data['aliases'])));
            } elseif (is_string($data['aliases'])) {
                $aliases = array_values(array_filter(array_map('trim', explode(',', $data['aliases']))));
            }
        }

        $description = isset($data['description']) ? trim((string)$data['description']) : '';
        if (mb_strlen($description) > 2000) {
            $errors['description'] = 'Description cannot exceed 2000 characters.';
        }

        $officialAssets = $data['official_assets'] ?? [];
        if (!is_array($officialAssets)) {
            $errors['official_assets'] = 'Official assets must be an array of handles/domains/packages.';
        }

        if (!empty($errors)) {
            throw new InvalidArgumentException(json_encode($errors));
        }

        return [
            'brand_name' => trim($data['brand_name']),
            'aliases' => $aliases,
            'description' => $description,
            'official_assets' => $officialAssets,
        ];
    }

    /**
     * Verifies an uploaded image file using magic bytes, EXIF sanitization & MIME constraints.
     * STRICTLY blocks SVGs to prevent stored XSS and XML entity attacks.
     */
    public static function validateAndSanitizeImage(string $tmpFilePath, string $originalFilename): array
    {
        if (!file_exists($tmpFilePath) || !is_readable($tmpFilePath)) {
            throw new InvalidArgumentException("Uploaded file could not be read.");
        }

        $fileSize = filesize($tmpFilePath);
        if ($fileSize === false || $fileSize > (2 * 1024 * 1024)) {
            throw new InvalidArgumentException("File size exceeds the 2MB limit.");
        }

        // 1. Extension inspection
        $ext = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));
        if (!in_array($ext, ['png', 'jpg', 'jpeg', 'webp'], true)) {
            throw new InvalidArgumentException("Unsupported file extension. Only PNG, JPG, and WebP are allowed (SVG is blocked).");
        }

        // 2. Read Magic Bytes (First 12 bytes)
        $fp = fopen($tmpFilePath, 'rb');
        $header = fread($fp, 12);
        fclose($fp);

        if (!$header || strlen($header) < 4) {
            throw new InvalidArgumentException("Invalid or corrupted file content.");
        }

        $mime = '';
        if (substr($header, 0, 8) === "\x89PNG\r\n\x1a\n") {
            $mime = 'image/png';
        } elseif (substr($header, 0, 3) === "\xFF\xD8\xFF") {
            $mime = 'image/jpeg';
        } elseif (substr($header, 0, 4) === "RIFF" && substr($header, 8, 4) === "WEBP") {
            $mime = 'image/webp';
        } else {
            throw new InvalidArgumentException("Magic-byte check failed. The file is not a genuine PNG, JPEG, or WebP image.");
        }

        // 3. Re-encode image with GD to strip all EXIF metadata and malicious payloads
        $gdImg = null;
        if ($mime === 'image/png') {
            $gdImg = @imagecreatefrompng($tmpFilePath);
        } elseif ($mime === 'image/jpeg') {
            $gdImg = @imagecreatefromjpeg($tmpFilePath);
        } elseif ($mime === 'image/webp') {
            $gdImg = @imagecreatefromwebp($tmpFilePath);
        }

        if (!$gdImg) {
            throw new InvalidArgumentException("Failed to decode and verify image content.");
        }

        $safeFilename = bin2hex(random_bytes(16)) . '.' . ($mime === 'image/jpeg' ? 'jpg' : ($mime === 'image/webp' ? 'webp' : 'png'));
        
        return [
            'valid' => true,
            'mime' => $mime,
            'gd_resource' => $gdImg,
            'safe_filename' => $safeFilename,
            'width' => imagesx($gdImg),
            'height' => imagesy($gdImg),
        ];
    }

    /**
     * Calculates the brand profile completeness score (0 to 100%)
     */
    public static function calculateCompletenessScore(array $profile, array $assets): int
    {
        $score = 0;

        // Brand Name (20%)
        if (!empty($profile['brand_name'])) $score += 20;

        // Logo Uploaded (20%)
        if (!empty($profile['logo_path']) || !empty($profile['logo_dhash'])) $score += 20;

        // Description (15%)
        if (!empty($profile['description']) && mb_strlen($profile['description']) >= 20) $score += 15;

        // Aliases (10%)
        if (!empty($profile['aliases'])) $score += 10;

        // Official Social Handles (15%)
        $hasSocial = false;
        $hasApps = false;
        $hasDomain = false;

        foreach ($assets as $asset) {
            $type = $asset['asset_type'] ?? '';
            if (str_starts_with($type, 'handle_')) $hasSocial = true;
            if (str_starts_with($type, 'app_') || $type === 'developer_name') $hasApps = true;
            if ($type === 'domain') $hasDomain = true;
        }

        if ($hasSocial) $score += 15;
        if ($hasApps) $score += 10;
        if ($hasDomain) $score += 10;

        return min(100, $score);
    }
}
