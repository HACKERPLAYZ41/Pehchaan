<?php
declare(strict_types=1);

namespace Pehchaan\Core;

use RuntimeException;
use InvalidArgumentException;

/**
 * Enterprise SSRF (Server-Side Request Forgery) Guard
 * Validates URLs, enforces DNS resolution checks against private CIDRs,
 * and executes secure outbound HTTP calls with strict size and time boundaries.
 */
class SSRFGuard
{
    private static array $blockedCidrs = [
        '0.0.0.0/8',          // Current network
        '10.0.0.0/8',         // Private IPv4 (RFC 1918)
        '100.64.0.0/10',      // Carrier-grade NAT (RFC 6598)
        '127.0.0.0/8',        // Loopback
        '169.254.0.0/16',     // Link Local / AWS & Cloud Metadata (RFC 3927)
        '172.16.0.0/12',      // Private IPv4 (RFC 1918)
        '192.0.0.0/24',       // IETF assignments
        '192.0.2.0/24',       // Documentation TEST-NET-1
        '192.88.99.0/24',     // 6to4 Relay
        '192.168.0.0/16',     // Private IPv4 (RFC 1918)
        '198.18.0.0/15',      // Benchmark testing
        '198.51.100.0/24',    // Documentation TEST-NET-2
        '203.0.113.0/24',     // Documentation TEST-NET-3
        '224.0.0.0/4',        // Multicast
        '240.0.0.0/4',        // Reserved
        '255.255.255.255/32', // Broadcast
        '::1/128',            // IPv6 Loopback
        'fc00::/7',           // IPv6 Unique Local
        'fe80::/10',          // IPv6 Link-Local
    ];

    /**
     * Validates if a target URL is safe from SSRF attacks.
     * Throws InvalidArgumentException on violation.
     */
    public static function validateUrl(string $url): string
    {
        $parts = parse_url($url);
        if (!$parts || empty($parts['scheme']) || empty($parts['host'])) {
            throw new InvalidArgumentException("Invalid URL format: {$url}");
        }

        $scheme = strtolower($parts['scheme']);
        if (!in_array($scheme, ['http', 'https'], true)) {
            throw new InvalidArgumentException("Forbidden protocol: '{$scheme}'. Only HTTP and HTTPS are permitted.");
        }

        $host = strtolower($parts['host']);

        // Quick check for obvious localhost aliases
        if (in_array($host, ['localhost', 'localhost.localdomain', '127.0.0.1', '::1', '0.0.0.0'], true)) {
            throw new InvalidArgumentException("SSRF blocked: Host '{$host}' is a loopback address.");
        }

        // DNS Resolution & IP Range Verification
        $ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : @dns_get_record($host, DNS_A + DNS_AAAA);
        $resolvedIps = [];

        if (is_array($ips)) {
            foreach ($ips as $record) {
                if (is_array($record)) {
                    if (isset($record['ip'])) $resolvedIps[] = $record['ip'];
                    if (isset($record['ipv6'])) $resolvedIps[] = $record['ipv6'];
                } elseif (is_string($record)) {
                    $resolvedIps[] = $record;
                }
            }
        }

        if (empty($resolvedIps)) {
            $singleIp = @gethostbyname($host);
            if ($singleIp && $singleIp !== $host) {
                $resolvedIps[] = $singleIp;
            }
        }

        if (empty($resolvedIps)) {
            throw new InvalidArgumentException("DNS resolution failed for host: {$host}");
        }

        foreach ($resolvedIps as $ip) {
            if (self::isIpInBlockedRange($ip)) {
                throw new InvalidArgumentException("SSRF blocked: Host '{$host}' resolved to restricted/private IP: {$ip}");
            }
        }

        return $url;
    }

    /**
     * Checks whether an IP address belongs to any blocked CIDR block.
     */
    public static function isIpInBlockedRange(string $ip): bool
    {
        // Direct loopback or private check
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            return true;
        }

        $ipPacked = @inet_pton($ip);
        if ($ipPacked === false) {
            return true;
        }

        $isV4 = strlen($ipPacked) === 4;

        foreach (self::$blockedCidrs as $cidr) {
            [$subnet, $bits] = explode('/', $cidr);
            $subnetPacked = @inet_pton($subnet);
            if ($subnetPacked === false) continue;

            $isSubnetV4 = strlen($subnetPacked) === 4;
            if ($isV4 !== $isSubnetV4) continue;

            $bits = (int)$bits;
            if (self::matchPackedIp($ipPacked, $subnetPacked, $bits)) {
                return true;
            }
        }

        return false;
    }

    private static function matchPackedIp(string $ipPacked, string $subnetPacked, int $bits): bool
    {
        $bytes = (int)($bits / 8);
        $remainder = $bits % 8;

        if ($bytes > 0 && substr($ipPacked, 0, $bytes) !== substr($subnetPacked, 0, $bytes)) {
            return false;
        }

        if ($remainder > 0) {
            $mask = ~((1 << (8 - $remainder)) - 1) & 0xFF;
            $ipByte = ord($ipPacked[$bytes]) & $mask;
            $subnetByte = ord($subnetPacked[$bytes]) & $mask;
            if ($ipByte !== $subnetByte) {
                return false;
            }
        }

        return true;
    }

    /**
     * Executes safe outbound HTTP GET with strict timeouts & size limits.
     */
    public static function safeGet(
        string $url,
        array $headers = [],
        int $timeoutSeconds = 8,
        int $maxSizeBytes = 5242880 // 5MB
    ): array {
        $safeUrl = self::validateUrl($url);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $safeUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false); // Prevent redirection SSRF bypass
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeoutSeconds);
        curl_setopt($ch, CURLOPT_MAXFILESIZE, $maxSizeBytes);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Pehchaan-Sentinel/1.0 (Digital Risk Protection; +https://pehchaan.blockcode.in)');

        if (!empty($headers)) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }

        // SSL verification enabled by default
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

        $body = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($body === false) {
            return [
                'success' => false,
                'status' => $httpCode ?: 504,
                'error' => $error ?: 'Outbound connection timed out or failed.',
                'body' => null,
            ];
        }

        return [
            'success' => ($httpCode >= 200 && $httpCode < 400),
            'status' => $httpCode,
            'error' => null,
            'body' => $body,
        ];
    }
}
