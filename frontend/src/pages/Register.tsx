/**
 * CareVision — Register Page
 * Phase 5 of UX improvements per carevision-ux-improvements.md
 *
 * WHY separate Register page: CHWs need a frictionless self-registration
 * path. Supervisors register through the same flow but are auto-deactivated
 * until an admin approves — communicated clearly in the UI.
 *
 * Validation: Client-side for UX; server enforces all constraints again
 * (Pydantic). This is not security — it's feedback speed.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Shield, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

type Role = 'chw' | 'supervisor';

export default function Register() {
  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole]               = useState<Role>('chw');
  const [facilityId, setFacilityId]   = useState('');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const login    = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const hasLength = password.length >= 8 && password.length <= 128;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);
  
  const passwordStrong = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const validName = /^[A-Za-z\s\-']+$/.test(fullName) && fullName.trim().length >= 2 && fullName.length <= 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validName) {
      setError('Please enter a valid full name (letters, spaces, hyphens, apostrophes only).');
      return;
    }

    if (!passwordStrong) {
      setError('Password does not meet the security requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { API_BASE_URL } = await import('@/constants/api');
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
          facility_id: facilityId || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.detail ?? 'Registration failed');
      }

      if (role === 'chw') {
        // CHWs are auto-approved but must explicitly log in for security
        navigate('/login', { state: { message: 'Account created successfully. Please sign in to continue.' }, replace: true });
      } else {
        // Supervisors await admin approval
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const focusStyle = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = '#0A6E5C';
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10,110,92,0.12)';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = 'var(--border-default)';
      e.currentTarget.style.boxShadow = 'none';
    },
  };

  // ── Success state for supervisor registration ──────────────────────────────
  if (success) {
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: '1rem',
            border: '1px solid var(--border-default)',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16,185,129,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
            aria-hidden
          >
            <CheckCircle2 size={28} style={{ color: '#10B981' }} />
          </div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Account Submitted
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Your supervisor account is pending approval. You'll receive confirmation
            from your facility administrator before you can log in.
          </p>
          <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
            Return to Sign In
          </Link>
        </motion.div>
      </div>
    );
  }

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
        {/* Branding */}
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
            Create Account
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Join CareVision as a Community Health Worker
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: '1rem',
            border: '1px solid var(--border-default)',
            padding: '2rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {/* Full name */}
            <div>
              <label
                htmlFor="reg-name"
                style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}
              >
                Full Name
              </label>
              <input
                id="reg-name"
                ref={nameRef}
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Mwangi"
                maxLength={100}
                style={inputStyle}
                {...focusStyle}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="reg-email"
                style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}
              >
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={255}
                style={inputStyle}
                {...focusStyle}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="reg-password"
                style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  maxLength={128}
                  style={{ ...inputStyle, paddingRight: '3rem' }}
                  {...focusStyle}
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
              {password.length > 0 && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <p style={{ fontSize: '0.6875rem', color: hasLength ? '#10B981' : '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.2s' }}>
                    {hasLength ? <CheckCircle2 size={12} /> : <span style={{width: 12, height: 12, borderRadius: '50%', border: '1px solid currentColor'}} />} 8-128 characters
                  </p>
                  <p style={{ fontSize: '0.6875rem', color: hasUpper && hasLower ? '#10B981' : '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.2s' }}>
                    {hasUpper && hasLower ? <CheckCircle2 size={12} /> : <span style={{width: 12, height: 12, borderRadius: '50%', border: '1px solid currentColor'}} />} Uppercase & lowercase letters
                  </p>
                  <p style={{ fontSize: '0.6875rem', color: hasNumber ? '#10B981' : '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.2s' }}>
                    {hasNumber ? <CheckCircle2 size={12} /> : <span style={{width: 12, height: 12, borderRadius: '50%', border: '1px solid currentColor'}} />} At least one number
                  </p>
                  <p style={{ fontSize: '0.6875rem', color: hasSpecial ? '#10B981' : '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.2s' }}>
                    {hasSpecial ? <CheckCircle2 size={12} /> : <span style={{width: 12, height: 12, borderRadius: '50%', border: '1px solid currentColor'}} />} At least one special character
                  </p>
                </div>
              )}
            </div>

            {/* Role selector */}
            <div>
              <label
                htmlFor="reg-role"
                style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}
              >
                Role
              </label>
              <select
                id="reg-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                {...focusStyle}
              >
                <option value="chw">Community Health Worker (CHW)</option>
                <option value="supervisor">Supervisor (requires approval)</option>
              </select>
              {role === 'supervisor' && (
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '0.375rem' }}>
                  Supervisor accounts are reviewed by your facility administrator before activation.
                </p>
              )}
            </div>

            {/* Facility ID (optional) */}
            <div>
              <label
                htmlFor="reg-facility"
                style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}
              >
                Facility ID{' '}
                <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span>
              </label>
              <input
                id="reg-facility"
                type="text"
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                placeholder="e.g. KE-NBI-001"
                maxLength={50}
                style={inputStyle}
                {...focusStyle}
              />
            </div>

            {/* Error */}
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
              disabled={isSubmitting || !email || !password || !fullName}
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
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus size={16} aria-hidden />
                  Create Account
                </>
              )}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--interactive-primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
