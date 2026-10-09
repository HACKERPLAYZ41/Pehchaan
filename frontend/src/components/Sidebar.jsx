import React, { useState } from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Building2, 
  Search, 
  AlertTriangle, 
  Settings, 
  FileText, 
  Trash2, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Activity,
  Menu,
  X
} from 'lucide-react';

export function Sidebar({ currentView, onNavigate, brand, onLoadSample, onResetWorkspace }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (view) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="show-mobile-only" style={{
        width: '100%',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1e293b',
        position: 'sticky',
        top: 0,
        zIndex: 90,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield className="w-5 h-5 text-blue-500" />
          <span style={{ fontWeight: 800, fontSize: '16px', fontFamily: 'var(--font-headline)' }}>Pehchaan SOC</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Menu</span>
        </button>
      </div>

      {/* Main Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        borderRight: '1px solid #1e293b',
        display: mobileOpen ? 'flex' : undefined,
        flexDirection: 'column',
        flexShrink: 0,
        minHeight: '100vh',
        position: 'relative',
        zIndex: 80,
      }} className={mobileOpen ? 'block' : 'hide-mobile'}>
        {/* Brand Header / Workspace Switcher */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e293b' }}>
          <div 
            onClick={() => handleNav('landing')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '16px' }}
          >
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
            <div>
              <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '18px', color: '#ffffff' }}>
                Pehchaan
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Digital Risk Protection
              </div>
            </div>
          </div>

          {/* Current Workspace Card */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {brand?.brand_name || 'My Organization'}
              </div>
              <div style={{ fontSize: '11px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck className="w-3 h-3" />
                <span>DPDP 7-Day Workspace</span>
              </div>
            </div>
            <button 
              onClick={onLoadSample} 
              title="Load Lumora Bank Demo" 
              style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: '4px' }}
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav Main */}
        <div style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px 8px' }}>
            SOC Monitoring
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <NavItem 
              icon={<LayoutDashboard className="w-4 h-4" />} 
              label="Dashboard Overview" 
              active={currentView === 'dashboard'} 
              onClick={() => handleNav('dashboard')} 
            />
            <NavItem 
              icon={<Building2 className="w-4 h-4" />} 
              label="Brand Profile" 
              active={currentView === 'brand'} 
              onClick={() => handleNav('brand')} 
            />
            <NavItem 
              icon={<Search className="w-4 h-4" />} 
              label="Scan Results" 
              active={currentView === 'scans'} 
              onClick={() => handleNav('scans')} 
            />
            <NavItem 
              icon={<AlertTriangle className="w-4 h-4" />} 
              label="Triage Queue" 
              active={currentView === 'triage'} 
              onClick={() => handleNav('triage')} 
            />
          </nav>

          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '16px 8px 8px' }}>
            Compliance & Legal
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <NavItem 
              icon={<FileText className="w-4 h-4" />} 
              label="Privacy & DPDP Policy" 
              active={currentView === 'privacy'} 
              onClick={() => handleNav('privacy')} 
            />
            <NavItem 
              icon={<FileText className="w-4 h-4" />} 
              label="Terms of Service" 
              active={currentView === 'terms'} 
              onClick={() => handleNav('terms')} 
            />
            <NavItem 
              icon={<Activity className="w-4 h-4" />} 
              label="System Health" 
              active={currentView === 'health'} 
              onClick={() => handleNav('health')} 
            />
          </nav>
        </div>

        {/* Footer / Right to Erasure */}
        <div style={{ padding: '16px', borderTop: '1px solid #1e293b' }}>
          <button 
            onClick={onResetWorkspace}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              color: '#f87171',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Delete My Workspace</span>
          </button>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
            DPDP Act Right to Erasure
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: active ? '#2563eb' : 'transparent',
        color: active ? '#ffffff' : '#94a3b8',
        fontWeight: active ? 600 : 500,
        fontSize: '13px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
      }}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {active && <ChevronRight className="w-4 h-4" />}
    </button>
  );
}
