<?php
declare(strict_types=1);

/**
 * Pehchaan (पहचान) - Main API Gateway & Entrypoint Router
 * Serves REST endpoints with strict security, rate limiting, and exception isolation.
 */

// Simple lightweight .env loader
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile) && is_readable($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || str_starts_with($line, '#')) continue;
        if (str_contains($line, '=')) {
            [$k, $v] = explode('=', $line, 2);
            $k = trim($k);
            $v = trim($v, " \t\n\r\0\x0B\"'");
            if (!empty($k)) {
                putenv("{$k}={$v}");
                $_ENV[$k] = $v;
                $_SERVER[$k] = $v;
            }
        }
    }
}

// PSR-4 autoloader
spl_autoload_register(function ($class) {
    $prefix = 'Pehchaan\\';
    $baseDir = __DIR__ . '/../backend/src/';

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

use Pehchaan\Core\Request;
use Pehchaan\Core\Response;
use Pehchaan\Core\RateLimiter;
use Pehchaan\Services\WorkspaceService;
use Pehchaan\Services\BrandService;
use Pehchaan\Services\ScanService;
use Pehchaan\Services\ReviewService;
use Pehchaan\Connectors\ConnectorManager;
use Pehchaan\Services\AlertService;

try {
    // Apply Security Headers (CSP, HSTS, X-Content-Type-Options)
    Response::applySecurityHeaders();

$method = Request::getMethod();
$uri = Request::getUri();

// Strip base prefix if hosted under /api
$uri = preg_replace('/^\/api/', '', $uri) ?: '/';

// Direct health check without DB requirement
if ($uri === '/' || $uri === '/health') {
    Response::json([
        'system' => 'Pehchaan Digital Risk Protection API',
        'version' => '1.0.0',
        'status' => 'operational',
        'environment' => 'cPanel Production',
        'dpdp_act_compliant' => true,
    ]);
}

// 1. Rate Limiting Check
$clientIp = Request::getClientIp();
$rateLimiter = new RateLimiter();
if (!$rateLimiter->isAllowed("ip:{$clientIp}")) {
    AlertService::sendSecurityIncident(
        'RATE_LIMIT_EXCEEDED',
        $clientIp,
        "Excessive requests triggered IP rate limiter on client IP: {$clientIp}",
        'WARNING'
    );
    Response::error("Rate limit exceeded. Please wait a moment before sending more requests.", 429);
}

// 2. Resolve Workspace from Cookie / Header
$wsService = new WorkspaceService();
$cookieName = 'pehchaan_ws_token';
$wsCookie = Request::getCookie($cookieName) ?? Request::getBearerToken();
$workspace = $wsService->getOrCreateWorkspace($wsCookie);
$workspaceId = $workspace['id'];

// Refresh HttpOnly secure cookie
if (!headers_sent()) {
    setcookie($cookieName, $workspaceId, [
        'expires' => time() + (7 * 86400),
        'path' => '/',
        'domain' => '',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

    // --- AUTHENTICATION & CAPTCHA ENDPOINTS ---
    $authService = new \Pehchaan\Services\AuthService();

    if ($uri === '/auth/captcha' && $method === 'GET') {
        Response::json($authService->generateCaptcha());
    }

    if ($uri === '/auth/signin' && $method === 'POST') {
        $json = Request::getJson();
        $email = $json['email'] ?? '';
        $password = $json['password'] ?? '';
        $answer = (int)($json['captcha_answer'] ?? 0);
        $expected = (int)($json['captcha_expected'] ?? 0);

        $res = $authService->signIn($email, $password, $answer, $expected);
        Response::json($res);
    }

    if ($uri === '/auth/register' && $method === 'POST') {
        $json = Request::getJson();
        $brandName = $json['brand_name'] ?? $json['org'] ?? '';
        $email = $json['email'] ?? '';
        $password = $json['password'] ?? '';
        $answer = (int)($json['captcha_answer'] ?? 0);
        $expected = (int)($json['captcha_expected'] ?? 0);

        $res = $authService->register($brandName, $email, $password, $answer, $expected);
        Response::json($res);
    }

    if ($uri === '/auth/reset-password' && $method === 'POST') {
        $json = Request::getJson();
        $email = $json['email'] ?? '';
        $answer = (int)($json['captcha_answer'] ?? 0);
        $expected = (int)($json['captcha_expected'] ?? 0);

        $res = $authService->resetPassword($email, $answer, $expected);
        Response::json($res);
    }

    // --- WORKSPACE & CONSENT ENDPOINTS ---
    if ($uri === '/workspace' && $method === 'GET') {
        Response::json([
            'workspace' => $workspace,
        ]);
    }

    if ($uri === '/workspace/consent' && $method === 'POST') {
        $ok = $wsService->recordConsent($workspaceId);
        Response::json(['consent_recorded' => $ok]);
    }

    if ($uri === '/workspace' && $method === 'DELETE') {
        $deleted = $wsService->deleteWorkspace($workspaceId);
        // Clear cookie
        setcookie($cookieName, '', ['expires' => time() - 3600, 'path' => '/']);
        Response::json(['workspace_deleted' => $deleted, 'message' => 'All workspace data permanently erased per DPDP Act rights.']);
    }

    // --- BRAND PROFILE ENDPOINTS ---
    $brandService = new BrandService();

    if ($uri === '/brand' && $method === 'GET') {
        $profile = $brandService->getProfile($workspaceId);
        Response::json(['brand_profile' => $profile]);
    }

    if ($uri === '/brand' && $method === 'POST') {
        $json = Request::getJson();
        $profile = $brandService->saveProfile($workspaceId, $json);
        Response::json(['brand_profile' => $profile, 'message' => 'Brand profile updated successfully.']);
    }

    if ($uri === '/brand/sample' && $method === 'POST') {
        $sample = $brandService->loadSampleBrand($workspaceId);
        Response::json(['brand_profile' => $sample, 'message' => 'Sample brand (Lumora Bank) loaded successfully.']);
    }

    if ($uri === '/brand/logo' && $method === 'POST') {
        if (empty($_FILES['logo'])) {
            Response::error("No logo file uploaded.", 400);
        }
        $res = $brandService->uploadLogo($workspaceId, $_FILES['logo']);
        Response::json($res);
    }

    // --- SCAN ENDPOINTS ---
    $scanService = new ScanService();

    if ($uri === '/scan/social' && $method === 'POST') {
        $res = $scanService->runScan($workspaceId, 'social');
        Response::json($res);
    }

    if ($uri === '/scan/apps' && $method === 'POST') {
        $res = $scanService->runScan($workspaceId, 'apps');
        Response::json($res);
    }

    if ($uri === '/scan/full' && $method === 'POST') {
        $res = $scanService->runScan($workspaceId, 'full');
        Response::json($res);
    }

    // --- DETECTIONS & TRIAGE ENDPOINTS ---
    $reviewService = new ReviewService();

    if ($uri === '/detections' && $method === 'GET') {
        $filters = [
            'platform' => Request::getQuery('platform'),
            'severity' => Request::getQuery('severity'),
            'status' => Request::getQuery('status'),
        ];
        $detections = $reviewService->getDetections($workspaceId, $filters);
        Response::json([
            'detections_count' => count($detections),
            'detections' => $detections,
        ]);
    }

    if ($uri === '/detections/triage' && $method === 'POST') {
        $json = Request::getJson();
        $detectionId = $json['detection_id'] ?? '';
        $status = $json['status'] ?? '';
        $notes = $json['notes'] ?? null;

        $ok = $reviewService->updateStatus($workspaceId, $detectionId, $status, $notes);
        Response::json(['success' => $ok, 'message' => "Detection status updated to '{$status}'."]);
    }

    // --- EXPORT & TAKEDOWN ENDPOINTS ---
    if ($uri === '/export/csv' && $method === 'GET') {
        // Enforce specific export rate limit (max 5 exports per 60 seconds)
        if (!$rateLimiter->isAllowed("export_csv:{$clientIp}", 5, 60)) {
            Response::error("CSV export rate limit exceeded. Max 5 exports allowed per minute.", 429);
        }

        $detections = $reviewService->getDetections($workspaceId);
        if (empty($detections)) {
            Response::error("No threat detections found to export for this workspace. Run a threat scan first.", 404);
        }

        $csv = $reviewService->generateCsv($workspaceId);
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="pehchaan_threat_triage_' . date('Ymd_His') . '.csv"');
        echo $csv;
        exit;
    }

    if ($uri === '/takedown/draft' && $method === 'GET') {
        $detectionId = Request::getQuery('detection_id');
        if (empty($detectionId)) {
            Response::error("detection_id query parameter is required.", 400);
        }
        $draft = $reviewService->generateTakedownDraft($workspaceId, $detectionId);
        Response::json($draft);
    }

    // --- AI OPENROUTER CACHED ENDPOINTS ---
    if ($uri === '/ai/takedown' && $method === 'POST') {
        $json = Request::getJson();
        $aiService = new \Pehchaan\Services\AiService();
        $brandName = $json['brand_name'] ?? 'Brand';
        $targetEntity = $json['target_entity'] ?? 'Target Entity';
        $platform = $json['platform'] ?? 'Social';
        $reason = $json['reason'] ?? null;

        $res = $aiService->generateTakedownDraft($brandName, $targetEntity, $platform, $reason);
        Response::json($res);
    }

    if ($uri === '/ai/analyze' && $method === 'POST') {
        $json = Request::getJson();
        $aiService = new \Pehchaan\Services\AiService();
        $res = $aiService->analyzeThreat($json);
        Response::json($res);
    }

    // --- HEALTH & SOURCES ENDPOINTS ---
    if ($uri === '/sources/health' && $method === 'GET') {
        $connManager = new ConnectorManager();
        $health = $connManager->getHealthStatus();
        Response::json(['sources_health' => $health]);
    }

    // Fallback 404
    Response::error("Endpoint not found: {$method} {$uri}", 404);

} catch (InvalidArgumentException $e) {
    Response::error($e->getMessage(), 400);
} catch (Exception $e) {
    error_log("[Pehchaan Gateway Exception] " . $e->getMessage());
    Response::error("An internal server error occurred.", 500);
}
