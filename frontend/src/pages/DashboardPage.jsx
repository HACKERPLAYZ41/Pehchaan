import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { 
  AlertTriangle, 
  Search, 
  Smartphone, 
  CheckCircle2, 
  RefreshCw, 
  Download, 
  ShieldAlert, 
  ExternalLink,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { NotificationList } from '../components/NotificationList';
import { GsapThreatTelemetry } from '../components/GsapThreatTelemetry';
import { api } from '../services/api';

export function DashboardPage({ onNavigate, brand, setBrand, onLoadSample, onResetWorkspace }) {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState(null);

  const fetchDetections = async () => {
    try {
      const data = await api.getDetections();
      setDetections(data.detections || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDetections();
  }, []);

  const handleRunScan = async (type = 'full') => {
    setLoading(true);
    setScanMessage("Scanning Bluesky Social, Google Play, and Apple App Store...");
    try {
      if (type === 'social') await api.runSocialScan();
      else if (type === 'apps') await api.runAppScan();
      else await api.runFullScan();
      
      await fetchDetections();
      setScanMessage("Scan complete! New threats updated.");
    } catch (err) {
      setScanMessage(`Scan error: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setScanMessage(null), 4000);
    }
  };

  // Compute metrics
  const totalThreats = detections.length;
  const highSeverity = detections.filter(d => d.severity === 'HIGH').length;
  const mediumSeverity = detections.filter(d => d.severity === 'MEDIUM').length;
  const underReview = detections.filter(d => d.status === 'under_review').length;
  const newThreats = detections.filter(d => d.status === 'new').length;

  const totalCounterRef = useRef(null);
  const highCounterRef = useRef(null);
  const newCounterRef = useRef(null);
  const reviewCounterRef = useRef(null);

  useEffect(() => {
    const counterObj = { total: 0, high: 0, newT: 0, review: 0 };
    gsap.to(counterObj, {
      total: totalThreats,
      high: highSeverity,
      newT: newThreats,
      review: underReview,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => {
        if (totalCounterRef.current) totalCounterRef.current.innerText = Math.round(counterObj.total);
        if (highCounterRef.current) highCounterRef.current.innerText = Math.round(counterObj.high);
        if (newCounterRef.current) newCounterRef.current.innerText = Math.round(counterObj.newT);
        if (reviewCounterRef.current) reviewCounterRef.current.innerText = Math.round(counterObj.review);
      }
    });

    gsap.from('.stat-counter-card', {
      scale: 0.95,
      opacity: 0.5,
      stagger: 0.08,
      duration: 0.5,
      ease: 'back.out(1.4)'
    });
  }, [totalThreats, highSeverity, newThreats, underReview]);

  return (
    <div className="dashboard-layout-container">
      <Sidebar 
        currentView="dashboard" 
        onNavigate={onNavigate} 
        brand={brand} 
        onLoadSample={onLoadSample}
        onResetWorkspace={onResetWorkspace}
      />

      <main className="dashboard-main-content">
        {/* Top Bar / Header */}
        <div className="dashboard-header-row">
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              SOC Security Dashboard
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Monitoring impersonation vectors for <strong>{brand?.brand_name || 'My Organization'}</strong>
            </p>
          </div>

          <div className="dashboard-header-actions">
            <NotificationList onNavigate={onNavigate} />
            
            <button 
              onClick={() => handleRunScan('full')} 
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: '1 1 auto', minHeight: '38px', fontSize: '13px' }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Scanning...' : 'Run Full Scan'}</span>
            </button>
            <a 
              href={api.getCsvExportUrl()} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ flex: '0 0 auto', minHeight: '38px', fontSize: '13px' }}
              title="Export Threat CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {scanMessage && (
          <div style={{ backgroundColor: '#e5eeff', border: '1px solid #2563eb', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#004ac6', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles className="w-4 h-4 shrink-0 text-blue-600" />
            <span>{scanMessage}</span>
          </div>
        )}

        {/* 4 Stat Metric Cards - Mobile 2x2, Desktop 4 columns */}
        <div className="stat-cards-grid" style={{ marginBottom: '20px' }}>
          <div className="glass-card stat-counter-card" style={{ padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Threats
            </div>
            <div ref={totalCounterRef} style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-headline)', lineHeight: 1.1 }}>
              {totalThreats}
            </div>
            <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '4px' }}>
              Social & App Stores
            </div>
          </div>

          <div className="glass-card stat-counter-card" style={{ padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              High Severity
            </div>
            <div ref={highCounterRef} style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626', fontFamily: 'var(--font-headline)', lineHeight: 1.1 }}>
              {highSeverity}
            </div>
            <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>
              Urgent triage
            </div>
          </div>

          <div className="glass-card stat-counter-card" style={{ padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              New Unreviewed
            </div>
            <div ref={newCounterRef} style={{ fontSize: '28px', fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-headline)', lineHeight: 1.1 }}>
              {newThreats}
            </div>
            <div style={{ fontSize: '11px', color: '#d97706', marginTop: '4px' }}>
              Awaiting action
            </div>
          </div>

          <div className="glass-card stat-counter-card" style={{ padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Under Review
            </div>
            <div ref={reviewCounterRef} style={{ fontSize: '28px', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-headline)', lineHeight: 1.1 }}>
              {underReview}
            </div>
            <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '4px' }}>
              Takedowns drafted
            </div>
          </div>
        </div>

        {/* GSAP Powered Live SOC Radar & Threat Telemetry Hub */}
        <GsapThreatTelemetry activeDetectionsCount={detections.length} isLiveScan={loading} />

        {/* Recent Detections List */}
        <div className="glass-card" style={{ padding: '18px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Recent Telemetry & Impersonation Flags
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Algorithmic detection across public platforms
              </p>
            </div>
            <button onClick={() => onNavigate('scans')} className="btn btn-ghost" style={{ fontSize: '12px', padding: '6px 10px' }}>
              <span>View All Scans</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {detections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
              <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>No threats flagged yet</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Click "Run Full Scan" or "Demo" to simulate real-time threat detection.</p>
              <button onClick={() => handleRunScan('full')} className="btn btn-primary" style={{ marginTop: '14px', fontSize: '13px' }}>
                Run First Scan Now
              </button>
            </div>
          ) : (
            <>
              {/* MOBILE VIEW: Responsive Threat Cards (< 768px) */}
              <div className="show-mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {detections.slice(0, 5).map((item) => (
                  <div key={item.id} className="mobile-threat-card">
                    {/* Top row: Platform & Severity */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                        {item.platform === 'bluesky' ? '🌐 Bluesky Social' : item.platform === 'google_play' ? '📱 Google Play' : '🍏 Apple App Store'}
                      </span>
                      <span className={`badge ${item.severity === 'HIGH' ? 'badge-threat' : 'badge-warning'}`}>
                        {item.severity}
                      </span>
                    </div>

                    {/* Target Entity Handle/Name */}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', fontFamily: item.detected_handle ? 'var(--font-mono)' : 'inherit', wordBreak: 'break-all' }}>
                        {item.detected_handle || item.detected_app_name || 'Unknown Entity'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Vector: {item.match_type || 'String similarity homoglyph'}
                      </div>
                    </div>

                    {/* Bottom row: Score, Status & Action */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className="badge badge-info font-mono">
                          {Math.round((item.similarity_score || item.name_distance || 0.85) * 100)}% match
                        </span>
                        <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                          {item.status?.replace('_', ' ') || 'New'}
                        </span>
                      </div>
                      <button 
                        onClick={() => onNavigate('triage')} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '6px' }}
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP VIEW: Full Telemetry Table (>= 769px) */}
              <div className="hide-mobile" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '12px 16px' }}>Platform</th>
                      <th style={{ padding: '12px 16px' }}>Detected Account / App</th>
                      <th style={{ padding: '12px 16px' }}>Score</th>
                      <th style={{ padding: '12px 16px' }}>Severity</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detections.slice(0, 5).map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>
                          {item.platform === 'bluesky' ? '🌐 Bluesky' : item.platform === 'google_play' ? '📱 Google Play' : '🍏 Apple App'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontFamily: item.detected_handle ? 'var(--font-mono)' : 'inherit' }}>
                            {item.detected_handle || item.detected_app_name || 'Unknown Entity'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            Reason: {item.match_type || 'String similarity'}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="badge badge-info font-mono">
                            {Math.round((item.similarity_score || item.name_distance || 0.85) * 100)}%
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className={`badge ${item.severity === 'HIGH' ? 'badge-threat' : 'badge-warning'}`}>
                            {item.severity}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                            {item.status?.replace('_', ' ') || 'New'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button onClick={() => onNavigate('triage')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
