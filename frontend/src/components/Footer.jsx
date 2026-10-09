import React from 'react';
import { Shield, Lock, FileText, CheckCircle2 } from 'lucide-react';

export function Footer({ onNavigate }) {
  return (
    <footer style={{
      backgroundColor: '#0f172a',
      color: '#eaf1ff',
      padding: '56px 24px 32px',
      borderTop: '1px solid #1e293b',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '40px',
          marginBottom: '48px',
        }}>
          {/* Col 1: Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}>
                <Shield className="w-5 h-5" />
              </div>
              <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '20px', color: '#ffffff' }}>
                Pehchaan
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '16px' }}>
              Digital Risk Protection platform focused on Social Media & App Store monitoring. We detect impersonators before they damage your brand.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(22, 163, 74, 0.15)',
              color: '#4ade80',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>DPDP Act 2023 Compliant</span>
            </div>
          </div>

          {/* Col 2: Product & App */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Platform Views
            </h4>
            <ul style={{ listStyle: 'none', space: 'y-2' }}>
              <li style={{ marginBottom: '8px' }}>
                <button onClick={() => onNavigate('dashboard')} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                  SOC Dashboard
                </button>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <button onClick={() => onNavigate('brand')} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                  Brand Profile Setup
                </button>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <button onClick={() => onNavigate('scans')} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                  Scan Results (Social & Apps)
                </button>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <button onClick={() => onNavigate('triage')} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                  Triage & Takedowns
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & DPDP Compliance */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Legal & Compliance
            </h4>
            <ul style={{ listStyle: 'none' }}>
              <li style={{ marginBottom: '8px' }}>
                <button onClick={() => onNavigate('privacy')} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                  Privacy Policy (DPDP 2023)
                </button>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <button onClick={() => onNavigate('terms')} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                  Terms & Conditions
                </button>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <button onClick={() => onNavigate('cookies')} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                  Cookie Policy & Consent
                </button>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <button onClick={() => onNavigate('404')} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                  Custom 404 Page Test
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Disclaimer */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Trust & System Specs
            </h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '12px' }}>
              <strong>Notice:</strong> Pehchaan DETECTS brand impersonations; it does NOT automatically block or remove accounts. It surfaces telemetry for manual SOC triage and platform takedown requests.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>HTTPS Enforced · Self-hosted Assets</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Data Retention: 7-day TTL (Auto-purge)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid #1e293b',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '13px',
          color: '#64748b',
        }}>
          <div>
            © 2026 Pehchaan. All rights reserved. Built for Indian enterprises & brand protection.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="/robots.txt" target="_blank" rel="noreferrer" style={{ color: '#64748b', textDecoration: 'none' }}>robots.txt</a>
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" style={{ color: '#64748b', textDecoration: 'none' }}>sitemap.xml</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
