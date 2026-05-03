/**
 * CareVision — Login Page
 * Phase 5 of UX improvements per carevision-ux-improvements.md
 *
 * Design: Trust-first layout — logo + tagline before form.
 * Framer Motion for entrance animation and error state reveal.
 * Password visibility toggle maintains minimum 44px tap target.
 * Auto-focus email on mount for faster mobile entry.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Shield, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const login    = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  // Auto-focus email on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      // WHY generic message: Prevent user enumeration (distinguish wrong
      // email vs wrong password). Backend returns unified error too.
      setError(
        msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('unauthorized')
          ? 'Invalid email or password. Please try again.'
          : msg
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared input style
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border-default)',
    backgroundColor: 'var(--bg-subtle)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    minHeight: '44px',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E6F7F4 0%, #F8FAFB 50%, #E8F1F8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '420px' }}
      >
        {/* ── Branding ────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0A6E5C 0%, #2C5F8D 100%)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 8px 24px rgba(10,110,92,0.25)',
            }}
            aria-hidden
          >
            <Shield size={28} style={{ color: '#FFFFFF' }} />
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.375rem',
            }}
          >
            CareVision
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Clinical Decision Support for Community Health Workers
          </p>
        </div>

        {/* ── Login card ──────────────────────────────────────────────── */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: '1rem',
            border: '1px solid var(--border-default)',
            padding: '2rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          }}
        >
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '1.5rem',
            }}
          >
            Sign In to Your Account
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.375rem',
                }}
              >
                Email Address
              </label>
              <input
                id="login-email"
                ref={emailRef}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#0A6E5C';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10,110,92,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.375rem',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ ...inputStyle, paddingRight: '3rem' }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#0A6E5C';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10,110,92,0.12)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: '0.25rem',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '44px',
                    minWidth: '44px',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
                role="alert"
              >
                <AlertCircle size={15} style={{ color: '#DC2626', flexShrink: 0, marginTop: '1px' }} aria-hidden />
                <p style={{ fontSize: '0.8125rem', color: '#B91C1C' }}>{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            >
              {isSubmitting ? (
                <>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#FFFFFF',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }}
                    aria-hidden
                  />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={16} aria-hidden />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Register link ───────────────────────────────────────────── */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{
              color: 'var(--interactive-primary)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Register as a CHW
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
