# Pehchaan (पहचान) - System Architecture & Pipeline Specification

## 1. Architectural Overview

Pehchaan is structured into five core decoupled layers:
1. **API Gateway & Boundary Security**: Rate limiting, HTTP Strict Transport Security, strict Content Security Policy, and SSRF outbound validation.
2. **Data Ingestion & Threat Connectors**: Resilient connectors querying live external threat feeds (Bluesky XRPC actor search, Apple iTunes Software Search API, Google Play Store search).
3. **Pure Algorithmic Detection Engine**: Mathematical analysis pipeline implementing Unicode NFKC normalization, homoglyph skeleton mapping, Damerau-Levenshtein distance, Jaro-Winkler similarity, phishing keyword modifier analysis, perceptual difference hashing (dHash), and shingle Jaccard overlap.
4. **Official Asset Whitelist & Exclusion Engine**: Multi-tiered exclusion check guaranteeing zero self-flagging for verified brand assets.
5. **Storage, Alerting & Triage**: MySQL database with strict prepared statements, Discord Webhook incident dispatching, CSV export, and legal abuse notice generation.

---

## 2. End-to-End Data Flow Diagram

```mermaid
graph TD
    subgraph "External Ecosystem"
        BSKY["Bluesky XRPC API"]
        APPLE["Apple iTunes Search API"]
        PLAY["Google Play Store"]
        DISCORD["Discord Security Webhook"]
    end

    subgraph "Boundary & Ingestion Layer"
        GW["API Gateway (public_html/index.php)"]
        RL["Sliding-Window Rate Limiter"]
        SSRF["SSRF Guard (DNS Re-Check & RFC 1918 Blocker)"]
        CM["Connector Manager (Cache & Backoff)"]
    end

    subgraph "Detection Pipeline (/backend/src/Engine/)"
        NORM["Normaliser (NFKC, Homoglyph Skeletons)"]
        EXCL{"Exclusion Filter (Official Whitelist?)"}
        DIST["String Distance (Damerau & Jaro-Winkler)"]
        TOK["Token & Phishing Modifier Analyzer"]
        DHASH["Image Perceptual dHash (Hamming <= 10)"]
        SHINGLE["Bio/Description Shingle Jaccard"]
        SCORER["Multi-Signal Composite Scorer (0-100)"]
    end

    subgraph "Persistence & Action"
        DB[("MySQL Database (Prepared Statements)")]
        ALERT["Alert Service"]
        TRIAGE["Review & Takedown Generator"]
    end

    GW --> RL --> SSRF
    SSRF --> CM
    CM -->|Live HTTP Request| BSKY
    CM -->|Live HTTP Request| APPLE
    CM -->|Live HTTP Request| PLAY

    BSKY -->|Candidate Payload| NORM
    APPLE -->|Candidate Payload| NORM
    PLAY -->|Candidate Payload| NORM

    NORM --> EXCL
    EXCL -->|YES: Verified Official| DB
    EXCL -->|NO: Suspect Entity| DIST
    EXCL -->|NO: Suspect Entity| TOK
    EXCL -->|NO: Suspect Entity| DHASH
    EXCL -->|NO: Suspect Entity| SHINGLE

    DIST --> SCORER
    TOK --> SCORER
    DHASH --> SCORER
    SHINGLE --> SCORER

    SCORER -->|Threat Record + Evidence| DB
    SCORER -->|High / Critical Threats| ALERT
    ALERT -->|Instant Webhook POST| DISCORD
    DB --> TRIAGE
```

---

## 3. Official Asset Whitelist & Exclusion Step

To prevent brands from receiving false alarms regarding their own legitimate accounts, apps, and domains, Pehchaan implements an **Exclusion Filter** prior to threat scoring:

1. **Exact Handle / ID Equality**: If `Normaliser::stripSeparators(candidate.external_id)` matches any verified official asset, the entity is tagged as `Official Verified` (Score: 0, Severity: LOW) and excluded from alerts.
2. **Domain Matching**: Subdomain or exact host comparisons against the brand's verified domain list.
3. **Authorized Developer Check**: App store developers matching the official registered entity are marked authentic.
4. **Workspace Allowlist**: Items previously reviewed by the security team and triaged as `false_positive` are persisted in the workspace allowlist.

---

## 4. Multi-Signal Scoring Heuristics

To prevent over-flagging single coincidental word matches, the scoring engine enforces a multi-signal rule:
* **High Severity ($\ge 60$)** and **Critical Severity ($\ge 80$)** strictly require **$\ge 2$ independent algorithmic signals** (e.g., Lexical Edit Distance + Phishing Modifier or Homoglyph + Logo Clone).
* Single-signal coincidences are capped at Medium or Low severity.
* Generic industry dictionary terms (e.g. `foods`, `lighting`, `textiles`, `pharmacy`, `logistics`) trigger a suppression penalty unless accompanied by verified trademark impersonation.
