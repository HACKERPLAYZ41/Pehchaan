<?php
declare(strict_types=1);

namespace Pehchaan\Utils;

/**
 * Security URL & Threat Handle Defanger
 * Converts active malicious links and deceptive handles into safe displayable strings (e.g. hxxps://bad[.]com)
 */
class Defanger
{
    /**
     * Defangs a suspicious URL to prevent accidental click execution.
     * Example: https://lum0ra-bank.phish.com -> hxxps://lum0ra-bank[.]phish[.]com
     */
    public static function defangUrl(string $url): string
    {
        $safe = trim($url);
        
        // Protocol defanging
        $safe = preg_replace('/^https:\/\//i', 'hxxps://', $safe);
        $safe = preg_replace('/^http:\/\//i', 'hxxp://', $safe);
        
        // Period dot defanging (except within tags or protocol)
        $safe = str_replace('.', '[.]', $safe);
        
        // At symbol defanging
        $safe = str_replace('@', '[@]', $safe);

        return htmlspecialchars($safe, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * Defangs a social handle or app package name
     * Example: @LumoraBank_Support -> [@​]LumoraBank_Support
     */
    public static function defangHandle(string $handle): string
    {
        $clean = trim($handle);
        $clean = str_replace('@', '[@]', $clean);
        $clean = str_replace('.', '[.]', $clean);
        return htmlspecialchars($clean, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * Creates safe HTML link attribute dictionary
     */
    public static function getSafeLinkAttributes(): array
    {
        return [
            'rel' => 'noopener noreferrer nofollow',
            'target' => '_blank',
            'referrerpolicy' => 'no-referrer',
        ];
    }
}
