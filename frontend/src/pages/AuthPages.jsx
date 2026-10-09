import React, { useState } from 'react';
import { Shield, ArrowRight, CheckCircle2, Lock, KeyRound, AlertTriangle, Sparkles } from 'lucide-react';
import { CaptchaWidget } from '../components/CaptchaWidget';
import { api } from '../services/api';

export function SignInPage({ onNavigate, onLoadSample, setBrand }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaPayload, setCaptchaPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (honeypot) return;
    if (!captchaPayload || !captchaPayload.verified) {
      setError("Please complete the reCAPTCHA math verification challenge below.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.signIn({
        email,
        password,
        captcha_answer: captchaPayload.captcha_answer,
        captcha_expected: captchaPayload.captcha_expected
      });

      if (res && res.brand_profile && setBrand) {
        setBrand(res.brand_profile);
      }
      onNavigate('dashboard');
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '36px', backgroundColor: '#ffffff' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            margin: '0 auto 12px',
          }}>
            <Shield className="w-6 h-6" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            Sign in to Pehchaan
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Digital Risk Protection & Telemetry Dashboard
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#dc2626', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Honeypot field */}
          <input 
            type="text" 
            name="website_hp_check" 
            value={honeypot} 
            onChange={e => setHoneypot(e.target.value)} 
            style={{ display: 'none' }} 
            tabIndex={-1} 
            autoComplete="off" 
          />

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#434655', marginBottom: '6px' }}>
              Work Email Address
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="soc@yourcompany.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#434655' }}>
                Password
              </label>
              <button 
                type="button" 
                onClick={() => onNavigate('reset-password')}
                style={{ fontSize: '12px', color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Forgot password?
              </button>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>

          {/* reCAPTCHA Widget */}
          <CaptchaWidget onVerified={setCaptchaPayload} />

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
          >
            <span>{loading ? 'Authenticating SOC Session...' : 'Sign In to SOC Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Don't have an account?{' '}
          <button onClick={() => onNavigate('register')} style={{ color: '#2563eb', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>
            Register Organization
          </button>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <button onClick={onLoadSample} className="btn btn-secondary" style={{ width: '100%', fontSize: '13px' }}>
            <Sparkles className="w-4 h-4 text-amber-500" style={{ color: '#d97706' }} />
            <span>Fast Track: Load Lumora Bank Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage({ onNavigate, onLoadSample, setBrand }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    org: '',
    password: '',
  });
  const [captchaPayload, setCaptchaPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!captchaPayload || !captchaPayload.verified) {
      setError("Please complete the reCAPTCHA math verification challenge below.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.register({
        brand_name: formData.org || formData.name,
        email: formData.email,
        password: formData.password,
        captcha_answer: captchaPayload.captcha_answer,
        captcha_expected: captchaPayload.captcha_expected
      });

      if (res && res.brand_profile && setBrand) {
        setBrand(res.brand_profile);
      }
      onNavigate('dashboard');
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-card" style={{ maxWidth: '460px', width: '100%', padding: '36px', backgroundColor: '#ffffff' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            Register Your Brand on Pehchaan
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Setup Organization & DPDP Act 2023 7-Day Workspace
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#dc2626', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#434655', marginBottom: '6px' }}>
              Security Lead Name
            </label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Full Name"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#434655', marginBottom: '6px' }}>
              Work Email
            </label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="ciso@org.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#434655', marginBottom: '6px' }}>
              Company / Brand Name
            </label>
            <input 
              type="text" 
              required
              value={formData.org}
              onChange={e => setFormData({ ...formData, org: e.target.value })}
              placeholder="e.g. Lumora Financial Technologies"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#434655', marginBottom: '6px' }}>
              Account Password
            </label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 characters"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>

          {/* reCAPTCHA Widget */}
          <CaptchaWidget onVerified={setCaptchaPayload} />

          <div style={{ backgroundColor: '#f0fdf4', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: '#16a34a', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
            ✓ DPDP Act 2023 7-Day TTL workspace created. Data can be purged anytime.
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px' }}
          >
            <span>{loading ? 'Creating Brand Workspace...' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Already registered?{' '}
          <button onClick={() => onNavigate('signin')} style={{ color: '#2563eb', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResetPasswordPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [captchaPayload, setCaptchaPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!captchaPayload || !captchaPayload.verified) {
      setError("Please complete the reCAPTCHA math verification challenge below.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.resetPassword({
        email,
        captcha_answer: captchaPayload.captcha_answer,
        captcha_expected: captchaPayload.captcha_expected
      });
      setMessage(res.message || `Password reset link dispatched to ${email}.`);
    } catch (err) {
      setError(err.message || "Failed to process password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '36px', backgroundColor: '#ffffff' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            margin: '0 auto 12px',
          }}>
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            Reset Account Password
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Enter your work email to receive password recovery instructions
          </p>
        </div>

        {message && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#16a34a', marginBottom: '20px' }}>
            ✓ {message}
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#dc2626', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleReset}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#434655', marginBottom: '6px' }}>
              Work Email Address
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="soc@yourcompany.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>

          {/* reCAPTCHA Widget */}
          <CaptchaWidget onVerified={setCaptchaPayload} />

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
          >
            <span>{loading ? 'Processing Reset Request...' : 'Send Password Reset Link'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Remembered your password?{' '}
          <button onClick={() => onNavigate('signin')} style={{ color: '#2563eb', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
