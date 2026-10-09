<?php
declare(strict_types=1);

namespace Pehchaan\Tests\Unit;

// Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'Pehchaan\\';
    $baseDir = __DIR__ . '/../../src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

use Pehchaan\Core\SSRFGuard;
use InvalidArgumentException;

class SSRFGuardTest
{
    public static function run(): void
    {
        echo "===============================================================================\n";
        echo "           PEHCHAAN (पहचान) - SSRF GUARD SECURITY UNIT TESTS                  \n";
        echo "===============================================================================\n\n";

        $testVectors = [
            // Attack Vectors (Must be blocked)
            ['url' => 'http://127.0.0.1/admin', 'should_block' => true, 'desc' => 'IPv4 Loopback direct'],
            ['url' => 'http://localhost:8080/metrics', 'should_block' => true, 'desc' => 'Localhost hostname'],
            ['url' => 'http://169.254.169.254/latest/meta-data/', 'should_block' => true, 'desc' => 'AWS/Cloud Metadata IP (RFC 3927)'],
            ['url' => 'http://10.0.0.5/internal-api', 'should_block' => true, 'desc' => 'Private RFC 1918 10.0.0.0/8 range'],
            ['url' => 'http://192.168.1.1/router-login', 'should_block' => true, 'desc' => 'Private RFC 1918 192.168.0.0/16 range'],
            ['url' => 'http://172.16.0.100/cluster', 'should_block' => true, 'desc' => 'Private RFC 1918 172.16.0.0/12 range'],
            ['url' => 'file:///etc/passwd', 'should_block' => true, 'desc' => 'Arbitrary file:// protocol scheme'],
            ['url' => 'gopher://127.0.0.1:6379/_flushall', 'should_block' => true, 'desc' => 'Gopher protocol exploitation scheme'],
            ['url' => 'dict://127.0.0.1:11211/stat', 'should_block' => true, 'desc' => 'Dict protocol injection'],
            ['url' => 'http://0.0.0.0:8000/', 'should_block' => true, 'desc' => '0.0.0.0 INADDR_ANY alias'],
        ];

        $passed = 0;
        $failed = 0;

        foreach ($testVectors as $test) {
            $blocked = false;
            try {
                SSRFGuard::validateUrl($test['url']);
            } catch (InvalidArgumentException $e) {
                $blocked = true;
            }

            if ($blocked === $test['should_block']) {
                $passed++;
                echo "  [PASS] Blocked attack vector: {$test['desc']} ({$test['url']})\n";
            } else {
                $failed++;
                echo "  [FAIL] Failed to block vector: {$test['desc']} ({$test['url']})\n";
            }
        }

        echo "\n===============================================================================\n";
        if ($failed === 0) {
            echo "🎉 ALL SSRF SECURITY BOUNDARY TESTS PASSED ({$passed} passed, 0 failed)!\n";
        } else {
            echo "❌ SSRF SECURITY TESTS FAILED ({$passed} passed, {$failed} failed).\n";
        }
        echo "===============================================================================\n";
    }
}

SSRFGuardTest::run();
