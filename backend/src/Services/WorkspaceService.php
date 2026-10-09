<?php
declare(strict_types=1);

namespace Pehchaan\Services;

use Pehchaan\Core\Database;
use Pehchaan\Core\Request;
use PDO;
use Exception;

/**
 * Anonymous Workspace & DPDP Act Compliance Manager
 * Handles ephemeral 7-day workspace tokens, consent registration, and complete data deletion.
 */
class WorkspaceService
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    /**
     * Resolves existing workspace or initializes a new anonymous workspace.
     */
    public function getOrCreateWorkspace(?string $existingId = null): array
    {
        $ip = Request::getClientIp();
        $ua = Request::getUserAgent();
        $ipHash = hash('sha256', $ip);
        $uaHash = hash('sha256', $ua);
        $now = date('Y-m-d H:i:s');

        if (!empty($existingId)) {
            $stmt = $this->db->prepare("SELECT * FROM workspaces WHERE id = :id AND status = 'active' AND expires_at > :now");
            $stmt->execute([':id' => $existingId, ':now' => $now]);
            $ws = $stmt->fetch();
            if ($ws) {
                // Update last active timestamp
                $up = $this->db->prepare("UPDATE workspaces SET last_active_at = :now WHERE id = :id");
                $up->execute([':now' => $now, ':id' => $existingId]);
                return $ws;
            }
        }

        // Auto-purge expired workspaces occasionally
        if (mt_rand(1, 30) === 1) {
            $this->purgeExpiredWorkspaces();
        }

        // Create new anonymous workspace
        $newId = 'ws_' . bin2hex(random_bytes(16));
        $expiresAt = date('Y-m-d H:i:s', time() + (7 * 86400)); // 7 days

        $stmt = $this->db->prepare("
            INSERT INTO workspaces (id, created_at, last_active_at, expires_at, consent_given, ip_hash, user_agent_hash, status)
            VALUES (:id, :now, :now, :expires, 0, :ip, :ua, 'active')
        ");
        $stmt->execute([
            ':id' => $newId,
            ':now' => $now,
            ':expires' => $expiresAt,
            ':ip' => $ipHash,
            ':ua' => $uaHash,
        ]);

        return [
            'id' => $newId,
            'created_at' => $now,
            'expires_at' => $expiresAt,
            'consent_given' => 0,
            'status' => 'active',
        ];
    }

    /**
     * Registers unbundled user consent under DPDP Act 2023.
     */
    public function recordConsent(string $workspaceId): bool
    {
        $now = date('Y-m-d H:i:s');
        $stmt = $this->db->prepare("
            UPDATE workspaces 
            SET consent_given = 1, consent_at = :now 
            WHERE id = :id AND status = 'active'
        ");
        return $stmt->execute([':now' => $now, ':id' => $workspaceId]);
    }

    /**
     * Complete DPDP "Delete My Workspace" Right to Erasure
     * Fully deletes all brand profiles, detections, signals, and session records.
     */
    public function deleteWorkspace(string $workspaceId): bool
    {
        try {
            $this->db->beginTransaction();

            // Cascade delete removes related brand_profiles, official_assets, scan_runs, detections, signals
            $stmt = $this->db->prepare("DELETE FROM workspaces WHERE id = :id");
            $stmt->execute([':id' => $workspaceId]);

            $this->db->commit();

            AlertService::sendSecurityIncident(
                'WORKSPACE_PURGED_USER_REQUEST',
                Request::getClientIp(),
                "User requested immediate DPDP deletion for workspace: {$workspaceId}",
                'INFO'
            );

            return true;
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log("[Workspace Delete Error] " . $e->getMessage());
            return false;
        }
    }

    /**
     * Background purge for workspaces expired past 7 days and dismissed items past 30 days.
     */
    public function purgeExpiredWorkspaces(): int
    {
        try {
            $now = date('Y-m-d H:i:s');
            // 1. Delete expired workspaces
            $stmt = $this->db->prepare("DELETE FROM workspaces WHERE expires_at < :now OR status = 'deleted'");
            $stmt->execute([':now' => $now]);
            $purgedCount = $stmt->rowCount();

            // 2. Delete dismissed detections older than 30 days
            $cutoff30 = date('Y-m-d H:i:s', time() - (30 * 86400));
            $delDismissed = $this->db->prepare("DELETE FROM detections WHERE triage_status = 'dismissed' AND triaged_at < :cut");
            $delDismissed->execute([':cut' => $cutoff30]);

            return $purgedCount;
        } catch (Exception $e) {
            return 0;
        }
    }
}
