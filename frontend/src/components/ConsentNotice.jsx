import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export function ConsentNotice({ onNavigate }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('pehchaan_cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = async () => {
    localStorage.setItem('pehchaan_cookie_consent', 'accepted');
    try {
      await api.giveConsent();
    } catch (e) {
      // silent fallback
    }
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('pehchaan_cookie_consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      right: '16px',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
      padding: '16px 20px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
        <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" style={{ color: '#2563eb' }} />
        <p style={{ fontSize: '13px', color: '#434655' }}>
          <strong>DPDP Act 2023 Consent:</strong> Pehchaan uses essential session keys to manage workspace data securely. All scan data auto-expires in 7 days. Read our{' '}
          <button 
            onClick={() => onNavigate('privacy')}
            style={{ color: '#2563eb', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }}
          >
            Privacy Policy
          </button>.
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={handleDecline} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
          Decline
        </button>
        <button onClick={handleAccept} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '13px' }}>
          Accept & Continue
        </button>
      </div>
    </div>
  );
}
