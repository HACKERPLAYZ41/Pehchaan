import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export function CaptchaWidget({ onVerified }) {
  const [captchaData, setCaptchaData] = useState({ num1: 4, num2: 3, expected: 7, question: '4 + 3' });
  const [userAnswer, setUserAnswer] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState(null);

  const fetchCaptcha = async () => {
    try {
      const data = await api.getCaptcha();
      if (data && data.expected !== undefined) {
        setCaptchaData(data);
      }
    } catch (e) {
      // Fallback
      const n1 = Math.floor(Math.random() * 8) + 1;
      const n2 = Math.floor(Math.random() * 8) + 1;
      setCaptchaData({ num1: n1, num2: n2, expected: n1 + n2, question: `${n1} + ${n2}` });
    }
    setUserAnswer('');
    setIsChecked(false);
    setError(null);
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleCheck = (e) => {
    const checked = e.target.checked;
    setIsChecked(checked);
    if (checked) {
      if (parseInt(userAnswer, 10) === captchaData.expected) {
        setError(null);
        if (onVerified) {
          onVerified({
            verified: true,
            captcha_answer: parseInt(userAnswer, 10),
            captcha_expected: captchaData.expected
          });
        }
      } else {
        setError('Incorrect math solution. Click refresh for a new challenge.');
        setIsChecked(false);
      }
    }
  };

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      padding: '14px 16px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck className="w-5 h-5 text-emerald-600" style={{ color: '#16a34a' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
            reCAPTCHA Bot Defense
          </span>
        </div>
        <button 
          type="button" 
          onClick={fetchCaptcha} 
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
          title="Refresh math challenge"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
          Solve Challenge: <span className="font-mono" style={{ backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', color: '#0f172a', fontWeight: 700 }}>{captchaData.question} = ?</span>
        </div>
        <input 
          type="number" 
          value={userAnswer}
          onChange={e => { setUserAnswer(e.target.value); setIsChecked(false); setError(null); }}
          placeholder="Ans"
          style={{
            width: '70px',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            textAlign: 'center',
            fontWeight: 700
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
        <input 
          type="checkbox" 
          id="recaptcha_check"
          checked={isChecked}
          onChange={handleCheck}
          disabled={!userAnswer}
          style={{ width: '16px', height: '16px', cursor: userAnswer ? 'pointer' : 'not-allowed' }}
        />
        <label htmlFor="recaptcha_check" style={{ fontSize: '12px', color: isChecked ? '#16a34a' : '#475569', fontWeight: isChecked ? 700 : 500, cursor: 'pointer' }}>
          {isChecked ? '✓ Verified non-automated user' : 'I am not a robot (verify math answer)'}
        </label>
      </div>

      {error && (
        <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px', fontWeight: 600 }}>
          {error}
        </div>
      )}
    </div>
  );
}
