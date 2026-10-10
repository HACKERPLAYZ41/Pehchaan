<?php
declare(strict_types=1);

namespace Pehchaan\Services;

use Pehchaan\Core\Database;
use Pehchaan\Engine\StringDistance;
use Pehchaan\Utils\Defanger;
use PDO;
use Exception;
use InvalidArgumentException;

/**
 * Triage, False-Positive Allowlisting, CSV Export & Takedown Report Generator
 */
class ReviewService
{
    private PDO $db;
    private BrandService $brandService;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
        $this->brandService = new BrandService($this->db);
    }

    public function getDetections(string $workspaceId, array $filters = []): array
    {
        $sql = "
            SELECT d.*, sr.scan_type, sr.created_at as scan_time 
            FROM detections d
            JOIN scan_runs sr ON d.scan_run_id = sr.id
            WHERE d.workspace_id = :ws
        ";
        $params = [':ws' => $workspaceId];

        if (!empty($filters['platform'])) {
            $sql .= " AND d.platform = :plat";
            $params[':plat'] = $filters['platform'];
        }

        if (!empty($filters['severity'])) {
            $sql .= " AND d.severity = :sev";
            $params[':sev'] = $filters['severity'];
        }

        if (!empty($filters['status'])) {
            $sql .= " AND d.triage_status = :status";
            $params[':status'] = $filters['status'];
        }

        $sql .= " ORDER BY d.composite_score DESC, d.created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $detections = $stmt->fetchAll() ?: [];

        // Load signals for each detection and compute character diff
        $profile = $this->brandService->getProfile($workspaceId);
        $brandName = $profile['brand_name'] ?? 'Brand';

        foreach ($detections as &$det) {
            $sigStmt = $this->db->prepare("SELECT signal_type, signal_weight, evidence FROM detection_signals WHERE detection_id = :did ORDER BY signal_weight DESC");
            $sigStmt->execute([':did' => $det['id']]);
            $det['signals'] = $sigStmt->fetchAll() ?: [];

            // UI character diff signature element
            $det['character_diff'] = StringDistance::computeCharacterDiff($brandName, $det['display_name']);
            $det['defanged_url'] = Defanger::defangUrl($det['target_url']);
            $det['defanged_id'] = Defanger::defangHandle($det['external_id']);
        }

        return $detections;
    }

    public function updateStatus(
        string $workspaceId,
        string $detectionId,
        string $newStatus,
        ?string $notes = null
    ): bool {
        if (!in_array($newStatus, ['confirmed', 'false_positive', 'dismissed', 'pending'], true)) {
            throw new InvalidArgumentException("Invalid triage status: {$newStatus}");
        }

        // Fetch detection
        $stmt = $this->db->prepare("SELECT * FROM detections WHERE id = :id AND workspace_id = :ws");
        $stmt->execute([':id' => $detectionId, ':ws' => $workspaceId]);
        $det = $stmt->fetch();

        if (!$det) {
            throw new InvalidArgumentException("Detection not found.");
        }

        $now = date('Y-m-d H:i:s');

        $this->db->beginTransaction();
        try {
            $up = $this->db->prepare("
                UPDATE detections 
                SET triage_status = :status, triage_notes = :notes, triaged_at = :triaged_at, updated_at = :updated_at 
                WHERE id = :id AND workspace_id = :ws
            ");
            $up->execute([
                ':status' => $newStatus,
                ':notes' => $notes,
                ':triaged_at' => $now,
                ':updated_at' => $now,
                ':id' => $detectionId,
                ':ws' => $workspaceId,
            ]);

            // If marked as False Positive, add to allowlist
            if ($newStatus === 'false_positive') {
                $allow = $this->db->prepare("
                    INSERT INTO allowlist (workspace_id, platform, external_id, reason, created_at)
                    VALUES (:ws, :plat, :ext, :reason, :now)
                ");
                $allow->execute([
                    ':ws' => $workspaceId,
                    ':plat' => $det['platform'],
                    ':ext' => $det['external_id'],
                    ':reason' => $notes ?: 'Marked false positive during triage',
                    ':now' => $now,
                ]);
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function generateCsv(string $workspaceId): string
    {
        $detections = $this->getDetections($workspaceId);

        $out = fopen('php://memory', 'r+');
        fputcsv($out, [
            'Detection ID',
            'Platform',
            'Threat Identifier',
            'Display Name',
            'Defanged URL',
            'Risk Score',
            'Severity',
            'Triage Status',
            'Triage Notes',
            'Detected At',
            'Evidence Signals'
        ]);

        foreach ($detections as $d) {
            $signalsList = [];
            foreach ($d['signals'] as $s) {
                $signalsList[] = "[{$s['signal_type']}: +{$s['signal_weight']} | {$s['evidence']}]";
            }

            fputcsv($out, [
                $d['id'],
                $d['platform'],
                Defanger::defangHandle($d['external_id']),
                $d['display_name'],
                Defanger::defangUrl($d['target_url']),
                $d['composite_score'],
                $d['severity'],
                $d['triage_status'],
                $d['triage_notes'] ?? '',
                $d['created_at'],
                implode("; ", $signalsList)
            ]);
        }

        rewind($out);
        $csv = stream_get_contents($out);
        fclose($out);

        return $csv ?: '';
    }

    /**
     * Generates formal CERT-In / DMCA / Platform Abuse Takedown Notice text draft.
     */
    public function generateTakedownDraft(string $workspaceId, string $detectionId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM detections WHERE id = :id AND workspace_id = :ws");
        $stmt->execute([':id' => $detectionId, ':ws' => $workspaceId]);
        $det = $stmt->fetch();

        if (!$det) {
            throw new InvalidArgumentException("Detection not found.");
        }

        $profile = $this->brandService->getProfile($workspaceId);
        $brandName = $profile['brand_name'] ?? 'Our Brand';

        // Load signals
        $sigStmt = $this->db->prepare("SELECT signal_type, signal_weight, evidence FROM detection_signals WHERE detection_id = :did");
        $sigStmt->execute([':did' => $detectionId]);
        $signals = $sigStmt->fetchAll() ?: [];

        $evidenceBullets = [];
        foreach ($signals as $s) {
            $evidenceBullets[] = "  • {$s['signal_type']} (+{$s['signal_weight']} weight): {$s['evidence']}";
        }
        $evidenceText = !empty($evidenceBullets) ? implode("\n", $evidenceBullets) : "  • High visual and lexical similarity matching brand assets.";

        $defangedUrl = Defanger::defangUrl($det['target_url']);
        $rawUrl = $det['target_url'];
        $date = date('F j, Y');

        $noticeText = <<<EOT
LEGAL NOTICE OF TRADEMARK INFRINGEMENT & BRAND IMPERSONATION TAKEDOWN REQUEST
Date: {$date}
To: Abuse Response & Legal Operations Team / CERT-In Incident Response
Platform: {$det['platform']}

RE: Urgent Takedown of Impersonating Account/Application Targeting '{$brandName}'

Dear Abuse Operations Team,

This letter serves as formal notification that the following account/app hosted on your platform is engaging in unauthorized brand impersonation, deceitful phishing activity, and intellectual property infringement against our registered brand entity, '{$brandName}'.

I. INFRINGING ASSET DETAILS:
-------------------------------------------------------------------------------
• Target Platform:        {$det['platform']}
• Infringing Handle/ID:   {$det['external_id']}
• Infringing Name:        {$det['display_name']}
• Malicious Target URL:   {$rawUrl} (Defanged: {$defangedUrl})
• Severity Level:         {$det['severity']} (Risk Score: {$det['composite_score']}/100)
• Timestamp of Detection: {$det['created_at']} UTC

II. TECHNICAL EVIDENCE & ALGORITHMIC ANALYSIS:
-------------------------------------------------------------------------------
{$evidenceText}

III. DEMAND FOR ACTION:
-------------------------------------------------------------------------------
The suspect entity falsely represents itself as the official entity of '{$brandName}' and poses immediate risks of consumer deception, financial phishing, and credential harvesting.

Under applicable intermediary guidelines and IT Act provisions, we demand the immediate suspension and removal of this infringing entity.

Authorized Security Operations Contact:
Pehchaan Automated Risk Response Team
On behalf of: {$brandName}
Grievance Officer: legal-ops@blockcode.in
Platform: https://pehchaan.blockcode.in
EOT;

        return [
            'detection_id' => $detectionId,
            'subject' => "URGENT TAKEDOWN: Brand Impersonation on {$det['platform']} - {$det['external_id']}",
            'takedown_draft' => $noticeText,
            'defanged_url' => $defangedUrl,
            'raw_url' => $rawUrl,
        ];
    }
}
