<?php
declare(strict_types=1);

namespace Pehchaan\Services;

use Pehchaan\Core\Database;
use Pehchaan\Engine\ImageHash;
use Pehchaan\Engine\Normaliser;
use Pehchaan\Utils\Validator;
use PDO;
use Exception;
use InvalidArgumentException;

/**
 * Brand Profile & Official Whitelist Asset Manager
 */
class BrandService
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    public function getProfile(string $workspaceId): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM brand_profiles WHERE workspace_id = :ws");
        $stmt->execute([':ws' => $workspaceId]);
        $profile = $stmt->fetch();

        if (!$profile) {
            return null;
        }

        $profile['aliases'] = !empty($profile['aliases']) ? json_decode($profile['aliases'], true) : [];

        // Load official assets
        $assetStmt = $this->db->prepare("SELECT id, asset_type, asset_value, normalised_value FROM brand_official_assets WHERE brand_profile_id = :bid");
        $assetStmt->execute([':bid' => $profile['id']]);
        $profile['official_assets'] = $assetStmt->fetchAll() ?: [];

        return $profile;
    }

    public function saveProfile(string $workspaceId, array $input): array
    {
        $validated = Validator::validateBrandProfile($input);

        $brandName = $validated['brand_name'];
        $aliasesJson = json_encode($validated['aliases'], JSON_UNESCAPED_UNICODE);
        $description = $validated['description'];
        $officialAssets = $validated['official_assets'];

        $existing = $this->getProfile($workspaceId);
        $now = date('Y-m-d H:i:s');

        $this->db->beginTransaction();
        try {
            $profileId = null;
            $logoPath = $existing['logo_path'] ?? null;
            $logoDHash = $existing['logo_dhash'] ?? null;

            if ($existing) {
                $profileId = (int)$existing['id'];
                $update = $this->db->prepare("
                    UPDATE brand_profiles 
                    SET brand_name = :name, aliases = :aliases, description = :desc, updated_at = :now 
                    WHERE id = :id
                ");
                $update->execute([
                    ':name' => $brandName,
                    ':aliases' => $aliasesJson,
                    ':desc' => $description,
                    ':now' => $now,
                    ':id' => $profileId,
                ]);

                // Clear old assets and replace
                $del = $this->db->prepare("DELETE FROM brand_official_assets WHERE brand_profile_id = :bid");
                $del->execute([':bid' => $profileId]);
            } else {
                $insert = $this->db->prepare("
                    INSERT INTO brand_profiles (workspace_id, brand_name, aliases, description, created_at)
                    VALUES (:ws, :name, :aliases, :desc, :now)
                ");
                $insert->execute([
                    ':ws' => $workspaceId,
                    ':name' => $brandName,
                    ':aliases' => $aliasesJson,
                    ':desc' => $description,
                    ':now' => $now,
                ]);
                $profileId = (int)$this->db->lastInsertId();
            }

            // Insert official assets
            if (!empty($officialAssets)) {
                $assetIns = $this->db->prepare("
                    INSERT INTO brand_official_assets (brand_profile_id, asset_type, asset_value, normalised_value, created_at)
                    VALUES (:bid, :type, :val, :norm, :now)
                ");

                foreach ($officialAssets as $asset) {
                    $type = $asset['asset_type'] ?? 'domain';
                    $val = trim($asset['asset_value'] ?? '');
                    if (empty($val)) continue;
                    $norm = Normaliser::stripSeparators($val);

                    $assetIns->execute([
                        ':bid' => $profileId,
                        ':type' => $type,
                        ':val' => $val,
                        ':norm' => $norm,
                        ':now' => $now,
                    ]);
                }
            }

            // Calculate and update completeness score
            $completeness = Validator::calculateCompletenessScore(
                ['brand_name' => $brandName, 'description' => $description, 'logo_path' => $logoPath, 'aliases' => $validated['aliases']],
                $officialAssets
            );

            $compUpdate = $this->db->prepare("UPDATE brand_profiles SET completeness_score = :score WHERE id = :id");
            $compUpdate->execute([':score' => $completeness, ':id' => $profileId]);

            $this->db->commit();
            return $this->getProfile($workspaceId);

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function uploadLogo(string $workspaceId, array $file): array
    {
        $profile = $this->getProfile($workspaceId);
        if (!$profile) {
            throw new InvalidArgumentException("Please create a brand profile before uploading a logo.");
        }

        $tmpPath = $file['tmp_name'] ?? '';
        $origName = $file['name'] ?? 'logo.png';

        // Magic byte verification & EXIF stripping
        $verified = Validator::validateAndSanitizeImage($tmpPath, $origName);

        $uploadDir = __DIR__ . '/../../../public_html/uploads';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $savePath = $uploadDir . '/' . $verified['safe_filename'];
        $relativeUrl = 'uploads/' . $verified['safe_filename'];

        // Save sanitized GD image as WebP or PNG
        $gd = $verified['gd_resource'];
        $dHash = ImageHash::computeDHash($gd);

        if ($verified['mime'] === 'image/jpeg') {
            imagejpeg($gd, $savePath, 90);
        } elseif ($verified['mime'] === 'image/webp') {
            imagewebp($gd, $savePath, 90);
        } else {
            imagepng($gd, $savePath, 8);
        }
        imagedestroy($gd);

        // Update brand profile with logo path and dhash
        $now = date('Y-m-d H:i:s');
        $stmt = $this->db->prepare("
            UPDATE brand_profiles 
            SET logo_path = :path, logo_dhash = :dhash, updated_at = :now 
            WHERE id = :id
        ");
        $stmt->execute([
            ':path' => $relativeUrl,
            ':dhash' => $dHash,
            ':now' => $now,
            ':id' => $profile['id'],
        ]);

        return [
            'logo_url' => $relativeUrl,
            'logo_dhash' => $dHash,
            'completeness_score' => Validator::calculateCompletenessScore(
                ['brand_name' => $profile['brand_name'], 'description' => $profile['description'], 'logo_path' => $relativeUrl, 'aliases' => $profile['aliases']],
                $profile['official_assets']
            ),
        ];
    }

    /**
     * One-click "Load Sample Brand" (Lumora Bank)
     */
    public function loadSampleBrand(string $workspaceId): array
    {
        $sampleData = [
            'brand_name' => 'Lumora Bank',
            'aliases' => ['Lumora', 'LumoraBank', 'Lumora Finance', 'Lumora Digital'],
            'description' => 'Lumora Bank is a next-generation digital financial services institution providing secure savings, instant lending, and corporate payment services.',
            'official_assets' => [
                ['asset_type' => 'handle_bsky', 'asset_value' => 'lumorabank.bsky.social'],
                ['asset_type' => 'handle_twitter', 'asset_value' => '@LumoraBank'],
                ['asset_type' => 'handle_instagram', 'asset_value' => 'lumora.official'],
                ['asset_type' => 'handle_linkedin', 'asset_value' => 'company/lumora-bank'],
                ['asset_type' => 'app_play_package', 'asset_value' => 'com.lumora.mobilebank'],
                ['asset_type' => 'app_ios_id', 'asset_value' => '1648291048'],
                ['asset_type' => 'developer_name', 'asset_value' => 'Lumora Financial Technologies Ltd'],
                ['asset_type' => 'domain', 'asset_value' => 'lumorabank.com'],
                ['asset_type' => 'domain', 'asset_value' => 'lumora.in'],
            ],
        ];

        $profile = $this->saveProfile($workspaceId, $sampleData);

        // Assign default sample logo path and dhash
        $up = $this->db->prepare("UPDATE brand_profiles SET logo_path = '/lumora-bank-logo.png', logo_dhash = 'f0e0c0800080c0f0', completeness_score = 100 WHERE id = :id");
        $up->execute([':id' => $profile['id']]);

        return $this->getProfile($workspaceId);
    }
}
