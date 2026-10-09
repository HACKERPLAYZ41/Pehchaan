<?php
declare(strict_types=1);

namespace Pehchaan\Services;

use Pehchaan\Services\WorkspaceService;
use Pehchaan\Services\BrandService;
use InvalidArgumentException;

class AuthService
{
    private WorkspaceService $wsService;
    private BrandService $brandService;

    public function __construct()
    {
        $this->wsService = new WorkspaceService();
        $this->brandService = new BrandService();
    }

    public function generateCaptcha(): array
    {
        $num1 = rand(1, 9);
        $num2 = rand(1, 9);
        return [
            'num1' => $num1,
            'num2' => $num2,
            'expected' => $num1 + $num2,
            'question' => "{$num1} + {$num2}"
        ];
    }

    public function verifyCaptcha(int $answer, int $expected): bool
    {
        return $answer === $expected;
    }

    public function signIn(string $email, string $password, int $answer, int $expected): array
    {
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("A valid work email address is required.");
        }
        if (empty($password) || strlen($password) < 6) {
            throw new InvalidArgumentException("Password must be at least 6 characters.");
        }
        if (!$this->verifyCaptcha($answer, $expected)) {
            throw new InvalidArgumentException("CAPTCHA verification failed. Please solve the math challenge correctly.");
        }

        // Generate or retrieve workspace for user session
        $workspaceToken = 'user_ws_' . md5(strtolower(trim($email)));
        $workspace = $this->wsService->getOrCreateWorkspace($workspaceToken);

        $brandProfile = $this->brandService->getProfile($workspace['id']);
        if (empty($brandProfile['brand_name']) || $brandProfile['brand_name'] === 'My Brand') {
            $parts = explode('@', $email);
            $domainPart = ucfirst(explode('.', $parts[1] ?? 'company')[0]);
            $brandProfile['brand_name'] = "{$domainPart} Org";
            $this->brandService->saveProfile($workspace['id'], $brandProfile);
        }

        return [
            'success' => true,
            'message' => 'Signed in successfully.',
            'workspace_token' => $workspaceToken,
            'user' => [
                'email' => $email,
                'role' => 'SOC Security Lead',
                'authenticated_at' => date('c'),
            ],
            'brand_profile' => $brandProfile
        ];
    }

    public function register(string $brandName, string $email, string $password, int $answer, int $expected): array
    {
        if (empty($brandName)) {
            throw new InvalidArgumentException("Brand Name is required.");
        }
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("A valid work email address is required.");
        }
        if (empty($password) || strlen($password) < 6) {
            throw new InvalidArgumentException("Password must be at least 6 characters.");
        }
        if (!$this->verifyCaptcha($answer, $expected)) {
            throw new InvalidArgumentException("CAPTCHA verification failed. Please solve the math challenge correctly.");
        }

        $workspaceToken = 'ws_reg_' . md5(strtolower(trim($email)) . '_' . time());
        $workspace = $this->wsService->getOrCreateWorkspace($workspaceToken);

        $brandProfile = [
            'brand_name' => trim($brandName),
            'brand_aliases' => [trim($brandName), str_replace(' ', '', trim($brandName))],
            'description' => "Protected digital brand workspace for " . trim($brandName),
            'official_social_handles' => ['bluesky' => strtolower(str_replace(' ', '', $brandName)) . '.bsky.social'],
            'official_app_ids' => ['play_store' => 'com.' . strtolower(str_replace(' ', '', $brandName)) . '.app'],
            'official_developer_names' => [trim($brandName) . ' Tech Ltd'],
            'official_domains' => [strtolower(str_replace(' ', '', $brandName)) . '.com']
        ];

        $savedProfile = $this->brandService->saveProfile($workspace['id'], $brandProfile);

        return [
            'success' => true,
            'message' => 'Organization brand registered successfully under DPDP Act 2023 compliance.',
            'workspace_token' => $workspaceToken,
            'user' => [
                'email' => $email,
                'role' => 'CISO / Security Admin',
                'authenticated_at' => date('c'),
            ],
            'brand_profile' => savedProfile
        ];
    }

    public function resetPassword(string $email, int $answer, int $expected): array
    {
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("A valid work email address is required.");
        }
        if (!$this->verifyCaptcha($answer, $expected)) {
            throw new InvalidArgumentException("CAPTCHA verification failed. Please solve the math challenge correctly.");
        }

        $ticketId = 'reset_' . substr(md5($email . time()), 0, 8);

        return [
            'success' => true,
            'message' => "Password reset instructions sent to {$email}. Ticket ID: {$ticketId}",
            'ticket_id' => $ticketId,
            'email' => $email
        ];
    }
}
