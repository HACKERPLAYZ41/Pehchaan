import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Smartphone, Globe, ExternalLink, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { api } from '../services/api';

export function ScanResultsPage({ onNavigate, brand, onLoadSample, onResetWorkspace }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'social', 'apps'
  const [severityFilter, setSeverityFilter] = useState('all'); // 'all', 'HIGH', 'MEDIUM'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (activeTab === 'social') filters.platform = 'bluesky';
      if (activeTab === 'apps') filters.platform = 'google_play'; // or app_store
      if (severityFilter !== 'all') filters.severity = severityFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;

      const data = await api.getDetections(filters);
      setDetections(data.detections || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, severityFilter, statusFilter]);

  const filteredItems = detections.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const handle = (item.detected_handle || '').toLowerCase();
    const appName = (item.detected_app_name || '').toLowerCase();
    const devName = (item.detected_developer_name || '').toLowerCase();
    return handle.includes(q) || appName.includes(q) || devName.includes(q);
  });

  return (
    <div className="dashboard-layout-container">
      <Sidebar 
        currentView="scans" 
        onNavigate={onNavigate} 
        brand={brand} 
        onLoadSample={onLoadSample}
        onResetWorkspace={onResetWorkspace}
      />

      <main className="dashboard-main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              Impersonation Telemetry & Scan Results
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Real-time threat discovery across Bluesky Social, Google Play, and Apple App Store.
            </p>
          </div>

          <button onClick={loadData} disabled={loading} className="btn btn-secondary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Results</span>
          </button>
        </div>

        {/* Tab & Filter Bar */}
        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
            <button 
              onClick={() => setActiveTab('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'all' ? '#2563eb' : 'transparent',
                color: activeTab === 'all' ? '#ffffff' : '#64748b',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              All Signals ({detections.length})
            </button>
            <button 
              onClick={() => setActiveTab('social')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'social' ? '#2563eb' : 'transparent',
                color: activeTab === 'social' ? '#ffffff' : '#64748b',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Social Media
            </button>
            <button 
              onClick={() => setActiveTab('apps')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'apps' ? '#2563eb' : 'transparent',
                color: activeTab === 'apps' ? '#ffffff' : '#64748b',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              App Stores
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search handle or app name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '13px', outline: 'none', width: '180px' }}
              />
            </div>

            <select 
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff' }}
            >
              <option value="all">Severity: All</option>
              <option value="HIGH">HIGH Severity</option>
              <option value="MEDIUM">MEDIUM Severity</option>
            </select>
          </div>
        </div>

        {/* Results List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredItems.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
              <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600 }}>No scan signals found</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Try switching filters or click "Run Full Scan" from the dashboard.</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 300px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '8px',
                    backgroundColor: '#e5eeff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    fontSize: '20px',
                    shrink: 0,
                  }}>
                    {item.platform === 'bluesky' ? '🌐' : item.platform === 'google_play' ? '📱' : '🍏'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', fontFamily: item.detected_handle ? 'var(--font-mono)' : 'inherit' }}>
                        {item.detected_handle || item.detected_app_name || 'Flagged Entity'}
                      </span>
                      <span className={`badge ${item.severity === 'HIGH' ? 'badge-threat' : 'badge-warning'}`}>
                        {item.severity}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span>Platform: <strong>{item.platform.toUpperCase()}</strong></span>
                      <span>Signal Type: <strong>{item.match_type || 'String Distance'}</strong></span>
                      {item.detected_developer_name && <span>Developer: <strong>{item.detected_developer_name}</strong></span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Similarity Score</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-mono)' }}>
                      {Math.round((item.similarity_score || item.name_distance || 0.88) * 100)}%
                    </div>
                  </div>

                  <button onClick={() => onNavigate('triage')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Triage & Takedown Draft
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
