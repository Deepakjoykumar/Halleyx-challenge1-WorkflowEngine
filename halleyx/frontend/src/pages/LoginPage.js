import React, { useState } from 'react';

const VALID_EMAIL = 'example@gmail.com';
const VALID_PASS  = 'exam123';

export default function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim())    { setError('Email is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate auth delay
    if (email.trim() === VALID_EMAIL && password === VALID_PASS) {
      onLogin({ email, name: 'Admin User' });
    } else {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg)', padding: 20,
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)',
          top: '-10%', left: '-10%',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,160,0.06) 0%, transparent 70%)',
          bottom: '10%', right: '5%',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 14,
            background: 'var(--accent-muted)', border: '1px solid var(--border2)',
            marginBottom: 16,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14l3 3 4-4"/>
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: 'var(--text)' }}>
            HALLEY<span style={{ color: 'var(--accent)' }}>X</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            workflow engine
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 16, padding: '32px 32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: 'var(--text)' }}>
            Sign in
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 24 }}>
            Enter your credentials to access the dashboard
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text3)', pointerEvents: 'none',
                }}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1" y="3" width="13" height="9" rx="1.5"/>
                    <path d="M1 5l6.5 4L14 5"/>
                  </svg>
                </span>
                <input
                  type="email"
                  className="form-input"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  style={{ paddingLeft: 34 }}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text3)', pointerEvents: 'none',
                }}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="6" width="11" height="8" rx="1.5"/>
                    <path d="M5 6V4a2.5 2.5 0 015 0v2"/>
                  </svg>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  style={{ paddingLeft: 34, paddingRight: 40 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)',
                    padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass
                    ? <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 7.5S3.5 2.5 7.5 2.5 14 7.5 14 7.5 11.5 12.5 7.5 12.5 1 7.5 1 7.5z"/><circle cx="7.5" cy="7.5" r="2"/><path d="M2 2l11 11"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 7.5S3.5 2.5 7.5 2.5 14 7.5 14 7.5 11.5 12.5 7.5 12.5 1 7.5 1 7.5z"/><circle cx="7.5" cy="7.5" r="2"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'var(--red-muted)', border: '1px solid rgba(240,85,102,0.25)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                fontSize: 12, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="7" cy="7" r="6"/><path d="M7 4v3M7 10v.5"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 13, marginTop: 4 }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Signing in…</>
                : 'Sign In →'
              }
            </button>
          </form>

          {/* Hint */}
          <div style={{
            marginTop: 20, padding: '10px 14px',
            background: 'var(--bg3)', borderRadius: 8,
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
              Demo Credentials
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text2)', lineHeight: 1.8 }}>
              <span style={{ color: 'var(--text3)' }}>Email: </span>
              <span style={{ color: 'var(--accent)' }}>example@gmail.com</span><br/>
              <span style={{ color: 'var(--text3)' }}>Pass:  </span>
              <span style={{ color: 'var(--accent)' }}>exam123</span>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 20 }}>
          Halleyx Workflow Engine © 2026
        </p>
      </div>
    </div>
  );
}
