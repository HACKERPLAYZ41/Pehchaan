import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function AlertDialog({ isOpen, onClose, onConfirm, title, description, confirmLabel = "Continue", cancelLabel = "Cancel", variant = "danger" }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div className="glass-card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '28px',
        backgroundColor: '#ffffff',
        boxShadow: 'var(--shadow-lg)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: variant === 'danger' ? '#fef2f2' : '#eff4ff',
            color: variant === 'danger' ? '#dc2626' : '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            shrink: 0,
          }}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            {title || 'Are you absolutely sure?'}
          </h3>
        </div>

        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
          {description || 'This action cannot be undone. This will permanently delete your workspace data and remove your specs from our servers.'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
            {cancelLabel}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
