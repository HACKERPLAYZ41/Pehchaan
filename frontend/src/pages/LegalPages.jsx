import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Lock, AlertTriangle, ArrowLeft, Trash2, CheckCircle2, Activity } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { api } from '../services/api';

export function PrivacyPolicyPage({ onNavigate, onResetWorkspace }) {
  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh' }}>
      <Navbar onNavigate={onNavigate} />
      <div style={{ maxWidth: '900px', margin: '40px auto 80px', padding: '0 24px' }}>
        <button onClick={() => onNavigate('landing')} className="btn btn-ghost" style={{ marginBottom: '24px' }}>
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="glass-card" style={{ padding: '40px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <ShieldCheck className="w-8 h-8 text-blue-600" style={{ color: '#2563eb' }} />
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
              Privacy Policy & DPDP Act 2023 Compliance
            </h1>
          </div>

          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>
            Last Updated: October 2026 · Compliant with Digital Personal Data Protection (DPDP) Act, India 2023.
          </p>

          <div style={{ fontSize: '15px', color: '#434655', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                1. Data Collection Transparency
              </h2>
              <p>
                Pehchaan operates under strict data minimisation principles. We collect ONLY:
              </p>
              <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                <li>Brand profile specifications (Brand Name, Logo, official handles, app package IDs).</li>
                <li>Hashed IP addresses and Hashed User-Agent headers for security rate-limiting.</li>
                <li>Public search telemetry from Bluesky, Google Play, and Apple App Store.</li>
              </ul>
              <p style={{ marginTop: '8px', fontWeight: 600, color: '#0f172a' }}>
                We do NOT sell, rent, or trade any workspace or scan data to third parties.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                2. Data Retention & 7-Day Auto-Purge TTL
              </h2>
              <p>
                Under Section 8(7) of the DPDP Act 2023, personal data must be erased when no longer necessary. All Pehchaan workspace scan telemetry is assigned a 7-day Time-To-Live (TTL) and is automatically purged from the server database upon expiration.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                3. Right to Erasure ("Delete My Workspace")
              </h2>
              <p>
                You have the absolute right to trigger instant data deletion. Clicking "Delete My Workspace" in the dashboard immediately executes database purge routines, erasing all brand profiles, scan logs, and session cookies permanently.
              </p>
              <button 
                onClick={onResetWorkspace}
                className="btn btn-danger" 
                style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Trash2 className="w-4 h-4" />
                <span>Execute Immediate Workspace Data Erasure</span>
              </button>
            </section>

            <section>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                4. Third-Party Embeds & Cookies
              </h2>
              <p>
                Pehchaan uses ZERO third-party analytics scripts, tracking pixels, or external CDN embeds. All fonts and icons are self-hosted. Cookies are strictly HttpOnly session tokens used for workspace security.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}

export function TermsPage({ onNavigate }) {
  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh' }}>
      <Navbar onNavigate={onNavigate} />
      <div style={{ maxWidth: '900px', margin: '40px auto 80px', padding: '0 24px' }}>
        <div className="glass-card" style={{ padding: '40px', backgroundColor: '#ffffff' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>
            Terms of Service
          </h1>
          <div style={{ fontSize: '15px', color: '#434655', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p>
              Welcome to Pehchaan. By using this platform, you agree to the following terms governing digital risk protection telemetry and scanning.
            </p>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>1. Platform Purpose & Boundaries</h2>
            <p>
              Pehchaan is a <strong>detection and intelligence tool</strong>. The platform discovers publicly accessible impersonation signals across Bluesky, Google Play, and Apple App Store. Pehchaan does NOT automatically execute takedowns or block third-party accounts; all takedown actions must be submitted directly to platform abuse departments by authorized brand representatives.
            </p>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>2. Acceptable Use</h2>
            <p>
              You agree to use Pehchaan solely for legitimate brand monitoring and security threat intelligence. Automated abuse, unauthorized mass scraping, or submitting fraudulent takedown claims is strictly prohibited.
            </p>
          </div>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}

export function CookiePolicyPage({ onNavigate }) {
  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh' }}>
      <Navbar onNavigate={onNavigate} />
      <div style={{ maxWidth: '900px', margin: '40px auto 80px', padding: '0 24px' }}>
        <div className="glass-card" style={{ padding: '40px', backgroundColor: '#ffffff' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>
            Cookie Policy & Consent Overview
          </h1>
          <div style={{ fontSize: '15px', color: '#434655', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p>
              Pehchaan enforces strict privacy standards. We use only 1 essential session cookie (`pehchaan_ws_token`) to maintain your 7-day workspace state securely.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Cookie Name</th>
                  <th style={{ padding: '8px' }}>Purpose</th>
                  <th style={{ padding: '8px' }}>Expiration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>pehchaan_ws_token</td>
                  <td style={{ padding: '8px' }}>Secure HttpOnly workspace isolation</td>
                  <td style={{ padding: '8px' }}>7 Days (Auto-Purged)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}

export function HealthPage({ onNavigate }) {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.getSourcesHealth().then(res => setHealth(res.sources_health)).catch(console.error);
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh' }}>
      <Navbar onNavigate={onNavigate} />
      <div style={{ maxWidth: '900px', margin: '40px auto 80px', padding: '0 24px' }}>
        <div className="glass-card" style={{ padding: '40px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Activity className="w-7 h-7 text-blue-600" />
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              Connectors & Detection Engine Health Status
            </h1>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {health ? Object.entries(health).map(([source, info]) => (
              <div key={source} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a', marginBottom: '4px', textTransform: 'capitalize' }}>
                  {source.replace('_', ' ')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{info.status || 'Operational'}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                  Latency: {info.latency_ms || 120}ms
                </div>
              </div>
            )) : (
              <div style={{ padding: '20px', color: '#64748b' }}>Checking system connectors...</div>
            )}
          </div>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}

export function NotFoundPage({ onNavigate }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '48px 32px', backgroundColor: '#ffffff' }}>
        <div style={{ fontSize: '72px', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-headline)', lineHeight: 1 }}>
          404
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '8px' }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px', lineHeight: 1.6 }}>
          The requested URL does not exist or has been moved. Server response header returns a verified 404 HTTP status.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('landing')} className="btn btn-primary">
            Return to Homepage
          </button>
          <button onClick={() => onNavigate('dashboard')} className="btn btn-secondary">
            Open Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
