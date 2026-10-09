# Pehchaan (पहचान) - STRIDE Threat Model & Security Posture

## 1. STRIDE Analysis & Defensive Controls

| Threat Category | Potential Vector | Pehchaan Mitigation Strategy |
| :--- | :--- | :--- |
| **Spoofing** | Forging workspace identity or spoofing official brand assets. | Anonymous workspaces are bound to random 256-bit cryptographically secure session IDs with `SameSite=Strict`, `HttpOnly`, and `Secure` cookie attributes. Official brand assets are strictly verified against exact normalized identifiers. |
| **Tampering** | Uploading malicious polyglot SVG/PHP files or altering API request payloads. | SVG uploads are **strictly prohibited**. Image uploads enforce 2MB limits, binary magic-byte header inspection (PNG, JPEG, WebP), and server-side GD re-encoding to strip EXIF data. `public_html/uploads/.htaccess` disables PHP script execution (`php_flag engine off`). |
| **Repudiation** | Denying fraudulent triage or unauthorized workspace deletion. | All security events, rate-limit triggers, SSRF blocks, and workspace deletions are permanently logged to `security_audit_logs` and dispatched immediately to the security operations team via Discord Webhook. |
| **Information Disclosure** | Exposing `.env` credentials, database connection strings, or PII. | The project architecture strictly isolates core code in `/backend/` outside the public webroot. Prepared statements prevent SQL error leakage. Suspicious links and handles are automatically defanged (`hxxp`, `[.]`) to protect analyst endpoints. |
| **Denial of Service** | Flooding API with automated scan requests or slowloris connections. | IP and workspace sliding-window rate limiters restrict requests (default 60 req/min). External connector calls enforce strict 8-second timeouts and fall back to cached responses. |
| **Elevation of Privilege / SSRF** | Exploiting server fetch to query `169.254.169.254` (Cloud Metadata) or internal LAN services. | `SSRFGuard` performs recursive DNS validation and blocks all loopback (`127.0.0.0/8`, `::1`), RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and carrier-grade/link-local addresses before initiating cURL requests. |

---

## 2. DPDP Act 2023 (India) Compliance Architecture

Pehchaan is engineered to strictly uphold the principles of India's **Digital Personal Data Protection Act, 2023**:

1. **Purpose Limitation**: Data collected from public feeds (handles, display names, public bio snippets, avatar hashes) is utilized exclusively for detecting brand impersonation and mitigating consumer fraud.
2. **Data Minimization**: No private data, login credentials, or non-public personal information is ever ingested or stored.
3. **Consent Framework**: Explicit, unbundled, unticked consent checkbox is presented and recorded prior to initiating any brand scan.
4. **Storage Limitation & Automatic Purge**:
   * Anonymous workspaces and scan histories are automatically purged after **7 days**.
   * Dismissed threat findings are permanently deleted after **30 days**.
5. **Right to Erasure ("Delete My Workspace")**: A dedicated API endpoint (`DELETE /api/workspace`) executes an immediate cascade deletion of all workspace records, brand profiles, and detection histories from the database.
