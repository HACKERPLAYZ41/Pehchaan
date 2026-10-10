import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  ShieldCheck, 
  Image as ImageIcon 
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { api } from '../services/api';

export function BrandProfilePage({ onNavigate, brand, setBrand, onLoadSample, onResetWorkspace }) {
  const [form, setForm] = useState({
    brand_name: '',
    brand_aliases: [],
    description: '',
    official_social_handles: { bluesky: '', twitter: '' },
    official_app_ids: { play_store: '', app_store: '' },
    official_developer_names: [],
    official_domains: [],
  });

  const [aliasInput, setAliasInput] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [developerInput, setDeveloperInput] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (brand) {
      setForm({
        brand_name: brand.brand_name || '',
        brand_aliases: Array.isArray(brand.brand_aliases) ? brand.brand_aliases : [],
        description: brand.description || '',
        official_social_handles: brand.official_social_handles || { bluesky: '', twitter: '' },
        official_app_ids: brand.official_app_ids || { play_store: '', app_store: '' },
        official_developer_names: Array.isArray(brand.official_developer_names) ? brand.official_developer_names : [],
        official_domains: Array.isArray(brand.official_domains) ? brand.official_domains : [],
      });
      if (brand.logo_url || brand.logo_path) {
        setLogoPreview(brand.logo_url || brand.logo_path);
      }
    }
  }, [brand]);

  // Calculate completeness meter score
  const calculateCompleteness = () => {
    let score = 0;
    if (form.brand_name) score += 20;
    if (form.description) score += 10;
    if (form.brand_aliases && form.brand_aliases.length > 0) score += 15;
    if (logoPreview || logoFile) score += 15;
    if (form.official_social_handles?.bluesky) score += 15;
    if (form.official_app_ids?.play_store || form.official_app_ids?.app_store) score += 15;
    if (form.official_domains && form.official_domains.length > 0) score += 10;
    return Math.min(100, score);
  };

  const completeness = calculateCompleteness();

  const handleAddAlias = (e) => {
    if (e.key === 'Enter' && aliasInput.trim()) {
      e.preventDefault();
      setForm(prev => ({ ...prev, brand_aliases: [...prev.brand_aliases, aliasInput.trim()] }));
      setAliasInput('');
    }
  };

  const handleRemoveAlias = (idx) => {
    setForm(prev => ({ ...prev, brand_aliases: prev.brand_aliases.filter((_, i) => i !== idx) }));
  };

  const handleAddDomain = (e) => {
    if (e.key === 'Enter' && domainInput.trim()) {
      e.preventDefault();
      setForm(prev => ({ ...prev, official_domains: [...prev.official_domains, domainInput.trim()] }));
      setDomainInput('');
    }
  };

  const handleRemoveDomain = (idx) => {
    setForm(prev => ({ ...prev, official_domains: prev.official_domains.filter((_, i) => i !== idx) }));
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Rule: NO SVG allowed (security byte check)
    if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
      setError("SVG files are strictly prohibited for security reasons. Please upload PNG, JPG, or WEBP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("File size exceeds 2MB limit.");
      return;
    }

    setError(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setError(null);

    try {
      // 1. Save JSON profile
      const res = await api.saveBrand(form);
      setBrand(res.brand_profile);

      // 2. Upload logo if file selected
      if (logoFile) {
        const logoRes = await api.uploadLogo(logoFile);
        if (logoRes.logo_url) {
          setLogoPreview(logoRes.logo_url);
        }
      }

      setMsg("Brand profile and white-list rules saved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-layout-container">
      <Sidebar 
        currentView="brand" 
        onNavigate={onNavigate} 
        brand={brand} 
        onLoadSample={onLoadSample}
        onResetWorkspace={onResetWorkspace}
      />

      <main className="dashboard-main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              Brand Profile & White-list Configuration
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Define your official brand assets. Detection engine uses this to eliminate false positives.
            </p>
          </div>

          <button onClick={onLoadSample} className="btn btn-secondary">
            <Sparkles className="w-4 h-4 text-amber-500" style={{ color: '#d97706' }} />
            <span>Load Lumora Bank Demo</span>
          </button>
        </div>

        {/* Completeness Meter */}
        <div className="glass-card" style={{ padding: '20px', marginBottom: '28px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Profile Completeness Score
            </span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: completeness > 70 ? '#16a34a' : '#d97706' }}>
              {completeness}%
            </span>
          </div>
          <div style={{ height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{
              width: `${completeness}%`,
              height: '100%',
              backgroundColor: completeness > 70 ? '#16a34a' : completeness > 40 ? '#d97706' : '#dc2626',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            {completeness < 70 ? 'Add official handles, domains, and logo to maximize impersonation detection accuracy.' : 'High completeness! Detection pipeline running with maximum precision.'}
          </div>
        </div>

        {msg && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', color: '#16a34a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', color: '#dc2626', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          {/* Identity Info */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
              1. Brand Identity
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#434655', marginBottom: '6px' }}>
                Brand Name *
              </label>
              <input 
                type="text" 
                required
                value={form.brand_name}
                onChange={e => setForm({ ...form, brand_name: e.target.value })}
                placeholder="e.g. Lumora Bank"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#434655', marginBottom: '6px' }}>
                Brand Aliases (Press Enter to add)
              </label>
              <input 
                type="text" 
                value={aliasInput}
                onChange={e => setAliasInput(e.target.value)}
                onKeyDown={handleAddAlias}
                placeholder="e.g. Lumora, LumoraBank, LumoraPay"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {form.brand_aliases.map((alias, i) => (
                  <span key={i} className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>{alias}</span>
                    <button type="button" onClick={() => handleRemoveAlias(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#434655', marginBottom: '6px' }}>
                Description / Tagline
              </label>
              <textarea 
                rows="3"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Short overview of official operations..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'inherit' }}
              />
            </div>

            {/* Logo Upload Zone */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#434655', marginBottom: '6px' }}>
                Official Logo (PNG / JPG / WEBP, Max 2MB, NO SVG)
              </label>
              
              <label 
                htmlFor="brand-logo-file-input"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: logoPreview ? '2px solid #3b82f6' : '2px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '20px 16px',
                  backgroundColor: logoPreview ? '#f0f9ff' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                {logoPreview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      padding: '4px'
                    }}>
                      <img 
                        src={logoPreview} 
                        alt="Brand Logo Preview" 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: 700 }}>
                        {logoFile ? logoFile.name : 'Official Brand Crest Loaded'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                        ✓ Ready for dHash Vision Scanning
                      </div>
                    </div>
                    <span 
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 12px', height: 'auto', marginTop: '4px', pointerEvents: 'none' }}
                    >
                      Change Logo
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '4px'
                    }}>
                      <Upload className="w-5 h-5 text-slate-600" />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                      Click to Browse or Drag Image Here
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      PNG, JPG, or WEBP up to 2MB (SVG blocked)
                    </div>
                  </div>
                )}
                
                <input 
                  id="brand-logo-file-input"
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={handleLogoSelect}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Whitelist Specs */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
              2. Official Whitelist & Connectors
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#434655', marginBottom: '6px' }}>
                Official Bluesky Handle
              </label>
              <input 
                type="text"
                value={form.official_social_handles.bluesky || ''}
                onChange={e => setForm({ ...form, official_social_handles: { ...form.official_social_handles, bluesky: e.target.value } })}
                placeholder="e.g. lumorabank.bsky.social"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#434655', marginBottom: '6px' }}>
                Google Play Package ID
              </label>
              <input 
                type="text"
                value={form.official_app_ids.play_store || ''}
                onChange={e => setForm({ ...form, official_app_ids: { ...form.official_app_ids, play_store: e.target.value } })}
                placeholder="e.g. com.lumora.bank"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#434655', marginBottom: '6px' }}>
                Apple App Store Numeric ID
              </label>
              <input 
                type="text"
                value={form.official_app_ids.app_store || ''}
                onChange={e => setForm({ ...form, official_app_ids: { ...form.official_app_ids, app_store: e.target.value } })}
                placeholder="e.g. 1492039281"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#434655', marginBottom: '6px' }}>
                Official Domains (Press Enter to add)
              </label>
              <input 
                type="text" 
                value={domainInput}
                onChange={e => setDomainInput(e.target.value)}
                onKeyDown={handleAddDomain}
                placeholder="e.g. lumorabank.com"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'var(--font-mono)' }}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {form.official_domains.map((dom, i) => (
                  <span key={i} className="badge badge-info font-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>{dom}</span>
                    <button type="button" onClick={() => handleRemoveDomain(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Specs...' : 'Save Brand Profile Specs'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
