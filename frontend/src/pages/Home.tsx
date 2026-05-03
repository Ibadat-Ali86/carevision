/**
 * CareVision — Home Page
 * Spec Reference: Section 4.1
 *
 * Layout:
 *   1. Header
 *   2. Hero Section (gradient headline + tagline + Language Selector)
 *   3. Feature Grid (2x2 on tablet/desktop, 1 column mobile)
 *   4. Stats Section (3 trust signals)
 *   5. Footer
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageContainer } from '@/components/layout/PageContainer';
import { FeatureCard } from '@/components/features/FeatureCard';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import { FEATURES } from '@/constants/features';
import { useSettingsStore } from '@/store/settingsStore';
import { Shield, Globe2, WifiOff, Zap, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const { onboardingCompleted } = useSettingsStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (!onboardingCompleted) {
      navigate('/onboarding', { replace: true });
    }
  }, [onboardingCompleted, navigate]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <Header />

      {/* Hero background gradient band */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '64px',
          left: 0,
          right: 0,
          height: '320px',
          background: 'linear-gradient(180deg, rgba(10,110,92,0.05) 0%, rgba(248,250,251,0) 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
        <PageContainer>
          {/* ── Hero Section ──────────────────────────────────────────────── */}
          <section
            aria-labelledby="hero-heading"
            style={{ paddingTop: 'var(--space-8)', marginBottom: 'var(--space-10)' }}
          >
            {/* AI Badge */}
            <div className="inline-flex items-center gap-1.5 mb-4" style={{
              padding: '5px 12px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(10,110,92,0.08)',
              border: '1px solid rgba(10,110,92,0.2)',
            }}>
              <Zap size={12} style={{ color: '#0A6E5C' }} aria-hidden />
              <span className="text-xs font-semibold" style={{ color: '#0A6E5C', letterSpacing: '0.04em' }}>
                POWERED BY GEMMA 3N AI
              </span>
            </div>

            {/* Headline */}
            <h1
              id="hero-heading"
              className="font-bold mb-4"
              style={{
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                lineHeight: '1.15',
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              Clinical{' '}
              <span className="gradient-text-teal">clarity</span>
              {' '}for the last mile.
            </h1>

            {/* Tagline */}
            <p
              style={{
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
                maxWidth: '520px',
                fontSize: '1.0625rem',
                marginBottom: '1.5rem',
              }}
            >
              AI-powered decision support for community health workers.
              Analyze test strips, medications, wounds, and clinical documents
              — online or offline.
            </p>

            {/* Language Selector */}
            <LanguageSelector />
          </section>

          {/* ── Feature Grid ──────────────────────────────────────────────── */}
          <section aria-label="Analysis features" style={{ marginBottom: 'var(--space-10)' }}>
            <p
              className="section-label"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              Choose Analysis Type
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
              }}
            >
              {FEATURES.map((feature, idx) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  animationDelay={idx * 80}
                />
              ))}
            </div>
          </section>

          {/* ── Protocol Assistant CTA ────────────────────────────────────── */}
          <section aria-label="Protocol Assistant" style={{ marginBottom: 'var(--space-8)' }}>
            <Link
              to="/protocol"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid rgba(10,110,92,0.2)',
                textDecoration: 'none',
                transition: 'all 200ms ease-in-out',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.boxShadow = '0 4px 12px rgba(10,110,92,0.15)';
                el.style.borderColor = 'rgba(10,110,92,0.4)';
                el.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                el.style.borderColor = 'rgba(10,110,92,0.2)';
                el.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #E8F1F8 0%, #B3E8DE 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <MessageSquare size={20} style={{ color: '#0A6E5C' }} aria-hidden />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {t('protocol_title')}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Ask WHO clinical guideline questions
                </p>
              </div>
              <div style={{
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(10,110,92,0.08)',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#0A6E5C',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}>
                AI Q&A
              </div>
            </Link>
          </section>

          {/* ── Trust Signal Stats ────────────────────────────────────────── */}
          <section
            aria-label="Platform capabilities"
            style={{ marginBottom: 'var(--space-6)' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1px',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                backgroundColor: 'var(--border-default)',
                border: '1px solid var(--border-default)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {[
                { icon: Zap, value: '4', label: 'Analysis Types', iconColor: '#0A6E5C', bg: '#E6F7F4' },
                { icon: Globe2, value: '15', label: 'Languages', iconColor: '#2C5F8D', bg: '#E8F1F8' },
                { icon: WifiOff, value: '100%', label: 'Offline Ready', iconColor: '#B45309', bg: 'rgba(245,158,11,0.1)' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    style={{
                      padding: '1rem 0.75rem',
                      backgroundColor: 'var(--bg-elevated)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.375rem',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: stat.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Icon size={16} aria-hidden style={{ color: stat.iconColor }} />
                    </div>
                    <p className="text-xl font-bold" style={{ color: 'var(--text-primary)', lineHeight: 1 }}>
                      {stat.value}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Privacy trust signal ──────────────────────────────────────── */}
          <div
            className="flex items-center justify-center gap-2"
            style={{ marginBottom: 'var(--space-4)' }}
          >
            <Shield size={13} aria-hidden style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
              Images analyzed, never stored · No patient-identifiable data · GDPR compliant
            </p>
          </div>
        </PageContainer>
      </div>

      <Footer />
    </div>
  );
}
