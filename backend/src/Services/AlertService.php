<?php
declare(strict_types=1);

namespace Pehchaan\Services;

use Pehchaan\Core\SSRFGuard;
use Pehchaan\Utils\Defanger;
use Exception;

/**
 * Enterprise Alert Dispatcher
 * Dispatches real-time structured embeds to Discord Webhooks for security breaches,
 * rate limit violations, SSRF attempts, and high/critical impersonation discoveries.
 */
class AlertService
{
    private static array $config = [];

    private static function getConfig(): array
    {
        if (empty(self::$config)) {
            $configPath = __DIR__ . '/../../config/discord.php';
            if (file_exists($configPath)) {
                self::$config = require $configPath;
            }
        }
        return self::$config;
    }

    /**
     * Sends an instant Discord alert for high/critical impersonation findings.
     */
    public static function sendThreatAlert(
        string $brandName,
        string $platform,
        string $impostorHandle,
        int $score,
        string $severity,
        string $targetUrl,
        array $signals
    ): bool {
        $conf = self::getConfig();
        if (empty($conf['enabled']) || empty($conf['webhook_url'])) {
            return false;
        }

        $minSev = $conf['min_severity'] ?? 'HIGH';
        $sevLevels = ['LOW' => 1, 'MEDIUM' => 2, 'HIGH' => 3, 'CRITICAL' => 4];
        if (($sevLevels[$severity] ?? 1) < ($sevLevels[$minSev] ?? 3)) {
            return false; // Below minimum severity threshold
        }

        $color = $conf['colors'][$severity] ?? 0xD8432B;
        $defangedUrl = Defanger::defangUrl($targetUrl);
        $defangedHandle = Defanger::defangHandle($impostorHandle);

        $signalLines = [];
        foreach (array_slice($signals, 0, 4) as $sig) {
            $type = htmlspecialchars($sig['signal_type'] ?? 'signal');
            $weight = (int)($sig['signal_weight'] ?? 0);
            $evidence = htmlspecialchars($sig['evidence'] ?? '');
            $signalLines[] = "• **{$type}** (+{$weight}): `{$evidence}`";
        }
        $signalSummary = !empty($signalLines) ? implode("\n", $signalLines) : 'Multiple algorithmic anomalies detected.';

        $embed = [
            'title' => "🚨 [{$severity}] Impersonation Alert: {$brandName}",
            'description' => "A high-confidence brand impersonator was detected on **" . ucfirst($platform) . "**.",
            'color' => $color,
            'fields' => [
                [
                    'name' => 'Brand Targeted',
                    'value' => $brandName,
                    'inline' => true,
                ],
                [
                    'name' => 'Threat Severity',
                    'value' => "**{$severity}** (Score: {$score}/100)",
                    'inline' => true,
                ],
                [
                    'name' => 'Platform & Impostor',
                    'value' => ucfirst($platform) . " | `{$defangedHandle}`",
                    'inline' => false,
                ],
                [
                    'name' => 'Defanged URL',
                    'value' => "`{$defangedUrl}`",
                    'inline' => false,
                ],
                [
                    'name' => 'Top Algorithmic Signals',
                    'value' => $signalSummary,
                    'inline' => false,
                ],
            ],
            'footer' => [
                'text' => 'Pehchaan Digital Risk Protection • Blockcode Security Sentinel',
            ],
            'timestamp' => date('c'),
        ];

        return self::dispatchWebhook([
            'username' => $conf['bot_username'] ?? 'Pehchaan Sentinel',
            'avatar_url' => $conf['avatar_url'] ?? '',
            'embeds' => [$embed],
        ]);
    }

    /**
     * Sends a security event alert (e.g. SSRF blocked, rate-limit abuse, workspace deleted).
     */
    public static function sendSecurityIncident(
        string $eventType,
        string $ipAddress,
        string $details,
        string $severity = 'CRITICAL'
    ): bool {
        $conf = self::getConfig();
        if (empty($conf['enabled']) || empty($conf['webhook_url'])) {
            return false;
        }

        $color = $conf['colors']['SECURITY'] ?? 0x9B59B6;

        $embed = [
            'title' => "🛡️ Security Event: {$eventType}",
            'description' => "A security boundary event was triggered on the Pehchaan API Gateway.",
            'color' => $color,
            'fields' => [
                [
                    'name' => 'Event Type',
                    'value' => "`{$eventType}`",
                    'inline' => true,
                ],
                [
                    'name' => 'Client IP (Masked)',
                    'value' => substr(md5($ipAddress), 0, 10) . ' (Hashed)',
                    'inline' => true,
                ],
                [
                    'name' => 'Details',
                    'value' => "```\n" . substr($details, 0, 500) . "\n```",
                    'inline' => false,
                ],
            ],
            'footer' => [
                'text' => 'Pehchaan Security Gateway • Zero Trust Enforced',
            ],
            'timestamp' => date('c'),
        ];

        return self::dispatchWebhook([
            'username' => 'Pehchaan Sentinel Gateway',
            'avatar_url' => $conf['avatar_url'] ?? '',
            'embeds' => [$embed],
        ]);
    }

    private static function dispatchWebhook(array $payload): bool
    {
        $conf = self::getConfig();
        $webhookUrl = $conf['webhook_url'] ?? '';

        if (empty($webhookUrl) || !filter_var($webhookUrl, FILTER_VALIDATE_URL)) {
            return false;
        }

        try {
            $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            
            $ch = curl_init($webhookUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 4);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
            
            $res = curl_exec($ch);
            $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            return ($code >= 200 && $code < 300);
        } catch (Exception $e) {
            error_log("[Discord Webhook Error] " . $e->getMessage());
            return false;
        }
    }
}
