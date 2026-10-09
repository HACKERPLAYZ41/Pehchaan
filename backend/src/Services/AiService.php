<?php
declare(strict_types=1);

namespace Pehchaan\Services;

use Pehchaan\Core\Database;
use Exception;

class AiService
{
    private static array $models = [
        'google/gemini-2.0-flash-lite-preview-02-05:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'deepseek/deepseek-r1:free',
        'qwen/qwen-2.5-coder-32b-instruct:free',
        'openrouter/auto'
    ];

    /**
     * Generate formal platform takedown notice with caching & failover
     */
    public function generateTakedownDraft(string $brandName, string $targetEntity, string $platform, ?string $reason = null): array
    {
        $prompt = "You are a Legal & Cybersecurity SOC Analyst for '{$brandName}'. " .
                  "Generate a formal platform takedown request notice for an impersonating account.\n\n" .
                  "Target Brand: {$brandName}\n" .
                  "Flagged Account/App: {$targetEntity}\n" .
                  "Platform: {$platform}\n" .
                  "Reason for flag: " . ($reason ?? 'Lookalike handle with deceptive intent') . "\n\n" .
                  "Format the notice with:\n" .
                  "1. Formal Legal Notice Header\n" .
                  "2. Detailed Infringement Facts (homoglyphs, logo clone, fraudulent hotline)\n" .
                  "3. Immediate Action Required (Account suspension & takedown within 24 hours)\n" .
                  "4. Signature block for Pehchaan SOC Compliance Team.";

        $cacheKey = 'ai_takedown_' . md5($brandName . '|' . $targetEntity . '|' . $platform);
        
        $cachedResult = $this->getCachedResponse($cacheKey);
        if ($cachedResult !== null) {
            return [
                'notice' => $cachedResult,
                'cached' => true,
                'model' => 'cache-hit'
            ];
        }

        $notice = $this->callOpenRouterWithFailover($prompt);
        
        // Cache result for 7 days
        $this->setCachedResponse($cacheKey, $notice, 7 * 86400);

        return [
            'notice' => $notice,
            'cached' => false,
            'model' => 'openrouter-ai'
        ];
    }

    /**
     * Executive Threat AI Summary with caching & failover
     */
    public function analyzeThreat(array $threatData): array
    {
        $brand = $threatData['brand_name'] ?? 'Brand';
        $entity = $threatData['detected_handle'] ?? $threatData['detected_app_name'] ?? 'Flagged Entity';
        $platform = $threatData['platform'] ?? 'Social';
        $score = $threatData['similarity_score'] ?? 0.85;

        $prompt = "Analyze the following brand impersonation threat vector:\n" .
                  "Target Brand: {$brand}\n" .
                  "Detected Entity: {$entity}\n" .
                  "Platform: {$platform}\n" .
                  "Similarity Score: {$score}\n\n" .
                  "Provide a 2-sentence executive summary on risk severity and recommended SOC action.";

        $cacheKey = 'ai_summary_' . md5($brand . '|' . $entity . '|' . $platform);

        $cachedResult = $this->getCachedResponse($cacheKey);
        if ($cachedResult !== null) {
            return [
                'summary' => $cachedResult,
                'cached' => true
            ];
        }

        $summary = $this->callOpenRouterWithFailover($prompt);
        $this->setCachedResponse($cacheKey, $summary, 7 * 86400);

        return [
            'summary' => $summary,
            'cached' => false
        ];
    }

    /**
     * Server-side OpenRouter API call with model failover
     */
    private function callOpenRouterWithFailover(string $promptText): string
    {
        $apiKey = getenv('OPENROUTER_API_KEY') ?: $_ENV['OPENROUTER_API_KEY'] ?? $_SERVER['OPENROUTER_API_KEY'] ?? '';

        if (empty($apiKey)) {
            return $this->getRuleBasedFallback($promptText);
        }

        foreach (self::$models as $model) {
            try {
                $ch = curl_init('https://openrouter.ai/api/v1/chat/completions');
                $payload = json_encode([
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are an expert AI SOC Analyst specializing in digital risk protection, brand security, and platform takedowns.'],
                        ['role' => 'user', 'content' => $promptText]
                    ],
                    'temperature' => 0.3,
                    'max_tokens' => 600,
                ]);

                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST => true,
                    CURLOPT_POSTFIELDS => $payload,
                    CURLOPT_HTTPHEADER => [
                        'Content-Type: application/json',
                        'Authorization: Bearer ' . $apiKey,
                        'HTTP-Referer: https://pehchaan.blockcode.in',
                        'X-Title: Pehchaan Digital Risk Protection',
                    ],
                    CURLOPT_TIMEOUT => 8,
                ]);

                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpCode === 200 && $response) {
                    $data = json_decode($response, true);
                    if (!empty($data['choices'][0]['message']['content'])) {
                        return trim($data['choices'][0]['message']['content']);
                    }
                }
            } catch (Exception $e) {
                // Rotate to next model on exception
                continue;
            }
        }

        return $this->getRuleBasedFallback($promptText);
    }

    private function getRuleBasedFallback(string $promptText): string
    {
        return "FORMAL TAKEDOWN NOTICE & ABUSE REPORT\n\n" .
               "To: Platform Safety & Legal Compliance Team\n" .
               "Date: " . date('Y-m-d') . "\n\n" .
               "RE: Formal Brand Impersonation & Trademark Infringement Notice\n\n" .
               "Please be advised that the referenced account/application is engaged in unauthorized brand impersonation targeting our protected assets. The entity employs homoglyph tricks and fraudulent support hotline numbers to deceive customers.\n\n" .
               "Demands:\n" .
               "1. Immediate suspension of the offending entity.\n" .
               "2. Removal of deceptive brand collateral.\n\n" .
               "Submitted via Pehchaan Digital Risk Protection SOC Desk.";
    }

    private function getCachedResponse(string $cacheKey): ?string
    {
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("SELECT cached_data FROM connector_cache WHERE cache_key = :key AND expires_at > NOW()");
            $stmt->execute(['key' => $cacheKey]);
            $row = $stmt->fetch();
            return $row ? $row['cached_data'] : null;
        } catch (Exception $e) {
            return null;
        }
    }

    private function setCachedResponse(string $cacheKey, string $data, int $ttlSeconds): void
    {
        try {
            $pdo = Database::getConnection();
            $expiresAt = date('Y-m-d H:i:s', time() + $ttlSeconds);
            $stmt = $pdo->prepare("
                INSERT INTO connector_cache (cache_key, connector_name, query_term, cached_data, expires_at)
                VALUES (:key, 'ai_openrouter', 'takedown', :data, :expires)
                ON DUPLICATE KEY UPDATE cached_data = :data2, expires_at = :expires2
            ");
            $stmt->execute([
                'key' => $cacheKey,
                'data' => $data,
                'expires' => $expiresAt,
                'data2' => $data,
                'expires2' => $expiresAt
            ]);
        } catch (Exception $e) {
            // Ignore cache write errors gracefully
        }
    }
}
