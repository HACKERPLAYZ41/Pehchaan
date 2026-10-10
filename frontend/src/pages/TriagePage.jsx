import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Download, 
  X, 
  Copy, 
  ShieldAlert, 
  ExternalLink, 
  Check 
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { api } from '../services/api';

export function TriagePage({ onNavigate, brand, onLoadSample, onResetWorkspace }) {
  const [detections, setDetections] = useState([]);
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [takedownModal, setTakedownModal] = useState(null); // draft data
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const data = await api.getDetections();
      setDetections(data.detections || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (detectionId, newStatus) => {
    try {
      await api.updateTriageStatus(detectionId, newStatus, notes);
      await loadData();
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleGenerateTakedown = async (item) => {
    setLoading(true);
    try {
      const draft = await api.getTakedownDraft(item.id);
      setTakedownModal({ item, draft });
    } catch (err) {
      alert(`Takedown draft error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDraft = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dashboard-layout-container">
      <Sidebar 
        currentView="triage" 
        onNavigate={onNavigate} 
        brand={brand} 
        onLoadSample={onLoadSample}
        onResetWorkspace={onResetWorkspace}
      />

      <main className="dashboard-main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              Triage & Platform Takedown Desk
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Prioritize impersonation flags, update threat status, and generate platform takedown notices.
            </p>
          </div>

          <a 
            href={api.getCsvExportUrl()} 
            target="_blank" 
            rel="noreferrer"
            className="btn btn-secondary"
          >
            <Download className="w-4 h-4" />
            <span>Export Triage Report (CSV)</span>
          </a>
        </div>

        {/* Triage Queue Table */}
        <div className="glass-card" style={{ padding: '24px' }}>
          {detections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
              <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600 }}>Triage Queue Empty</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Run a scan or load sample data to generate threat tickets.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px' }}>Threat Target</th>
                    <th style={{ padding: '12px 16px' }}>Platform</th>
                    <th style={{ padding: '12px 16px' }}>Severity</th>
                    <th style={{ padding: '12px 16px' }}>Match Score</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {detections.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: item.detected_handle ? 'var(--font-mono)' : 'inherit' }}>
                          {item.detected_handle || item.detected_app_name || 'Flagged Account'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Type: {item.match_type || 'String similarity'}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>
                        {item.platform === 'bluesky' ? '🌐 Bluesky' : item.platform === 'google_play' ? '📱 Google Play' : '🍏 Apple App'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge ${item.severity === 'HIGH' ? 'badge-threat' : 'badge-warning'}`}>
                          {item.severity}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className="badge badge-info font-mono">
                          {Math.round((item.similarity_score || item.name_distance || 0.88) * 100)}%
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <select 
                          value={item.status}
                          onChange={e => handleStatusChange(item.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: item.status === 'resolved' ? '#f0fdf4' : item.status === 'under_review' ? '#e5eeff' : '#ffffff',
                            color: item.status === 'resolved' ? '#16a34a' : item.status === 'under_review' ? '#2563eb' : '#0f172a',
                          }}
                        >
                          <option value="new">New</option>
                          <option value="under_review">Under Review</option>
                          <option value="resolved">Resolved / Taken Down</option>
                          <option value="whitelisted">Whitelisted</option>
                        </select>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleGenerateTakedown(item)} 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Draft Takedown</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Takedown Draft Modal */}
        {takedownModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '640px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Platform Takedown Draft Notice
                </h3>
                <button onClick={() => setTakedownModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Pre-filled takedown letter formatted for platform abuse/copyright teams (Bluesky Abuse, Google Play DMCA, Apple Legal).
              </p>

              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                maxHeight: '300px',
                overflowY: 'auto',
                marginBottom: '20px',
                lineHeight: 1.5,
              }}>
                {takedownModal.draft?.notice || takedownModal.draft?.draft || 'Draft notice generated...'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setTakedownModal(null)} className="btn btn-secondary">
                  Close
                </button>
                <button 
                  onClick={() => handleCopyDraft(takedownModal.draft?.notice || takedownModal.draft?.draft || '')} 
                  className="btn btn-primary"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Takedown Notice'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
