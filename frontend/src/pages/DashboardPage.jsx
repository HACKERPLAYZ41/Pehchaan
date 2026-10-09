import React, { useState, useEffect } from 'react';
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
  Layers
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { NotificationList } from '../components/NotificationList';
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9ff' }}>
      <Sidebar 
        currentView="dashboard" 
        onNavigate={onNavigate} 
        brand={brand} 
        onLoadSample={onLoadSample}
        onResetWorkspace={onResetWorkspace}
      />

      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {/* Top Bar / Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              SOC Security Dashboard
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Monitoring impersonation vectors for <strong>{brand?.brand_name || 'My Organization'}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <NotificationList onNavigate={onNavigate} />
            
            <button 
              onClick={() => handleRunScan('full')} 
              disabled={loading}
              className="btn btn-primary"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Scanning Engine Running...' : 'Run Full Scan'}</span>
            </button>
            <a 
              href={api.getCsvExportUrl()} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-secondary"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {scanMessage && (
          <div style={{ backgroundColor: '#e5eeff', border: '1px solid #2563eb', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', color: '#004ac6', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles className="w-5 h-5 shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}

        {/* 4 Stat Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Total Flagged Threats</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-headline)' }}>{totalThreats}</div>
            <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '4px' }}>Across Social & App Stores</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>High Severity Risks</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#dc2626', fontFamily: 'var(--font-headline)' }}>{highSeverity}</div>
            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>Requires immediate triage</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>New Unreviewed</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-headline)' }}>{newThreats}</div>
            <div style={{ fontSize: '12px', color: '#d97706', marginTop: '4px' }}>Awaiting analyst action</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Under Investigation</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-headline)' }}>{underReview}</div>
            <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '4px' }}>Takedowns drafted</div>
          </div>
        </div>

        {/* Recent Detections List */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Recent Telemetry & Impersonation Flags
            </h3>
            <button onClick={() => onNavigate('scans')} className="btn btn-ghost" style={{ fontSize: '13px' }}>
              View All Scans →
            </button>
          </div>

          {detections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
              <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600 }}>No threats flagged yet</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Click "Run Full Scan" or "Load Demo" to simulate real-time threat detection.</p>
              <button onClick={() => handleRunScan('full')} className="btn btn-primary" style={{ marginTop: '16px' }}>
                Run First Scan Now
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
                          {item.status.replace('_', ' ')}
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
          )}
        </div>
      </main>
    </div>
  );
}
