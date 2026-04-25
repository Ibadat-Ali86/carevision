/**
 * CareVision — Header (Layout Component)
 * Spec Reference: Section 3.2.1
 *
 * Sticky global navigation with glassmorphism effect:
 * - CareVision wordmark + Stethoscope icon (left)
 * - Back button (optional, for feature pages)
 * - Settings link (right)
 * - Skip-to-content link (accessibility)
 * - role="banner"
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowLeft, Settings } from 'lucide-react';

interface HeaderProps {
  /** Show back arrow instead of logo on feature pages */
  showBackButton?: boolean;
  /** Route to navigate back to. Defaults to '/' */
  backRoute?: string;
  /** Page title displayed when showBackButton is true */
  pageTitle?: string;
}

export function Header({ showBackButton, backRoute = '/', pageTitle }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Skip to content — visually hidden, keyboard accessible (Spec Sec 6.2) */}
      <a href="#main-content" className="sr-only">
        Skip to main content
      </a>

      <header
        role="banner"
        className="sticky top-0 z-50 glass border-b"
        style={{
          height: '64px',
          borderBottomColor: 'var(--border-default)',
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid',
          // Subtle teal gradient accent line at top
          backgroundImage: 'linear-gradient(180deg, rgba(10,110,92,0.03) 0%, rgba(255,255,255,0) 100%)',
        }}
      >
        {/* Teal accent line at the very top */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #0A6E5C 0%, #0F9D7E 50%, transparent 100%)',
            opacity: 0.6,
          }}
        />

        <div
          className="h-full flex items-center justify-between px-4 sm:px-6 mx-auto"
          style={{ maxWidth: '1280px' }}
        >
          {/* Left — Logo or Back button */}
          {showBackButton ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(backRoute)}
                className="btn-icon"
                aria-label="Go back"
              >
                <ArrowLeft size={20} aria-hidden />
              </button>
              {pageTitle && (
                <h1
                  className="text-base font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {pageTitle}
                </h1>
              )}
            </div>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-2.5"
              aria-label="CareVision Home"
              style={{ textDecoration: 'none' }}
            >
              {/* Logo icon with teal glow ring */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0A6E5C 0%, #0F9D7E 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(10,110,92,0.3)',
                  flexShrink: 0,
                }}
              >
                <Stethoscope size={20} color="#FFFFFF" aria-hidden />
              </div>

              {/* Wordmark */}
              <div className="hidden sm:block">
                <span
                  className="text-lg font-bold"
                  style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
                >
                  Care
                  <span style={{ color: '#0A6E5C' }}>Vision</span>
                </span>
              </div>
            </Link>
          )}

          {/* Right — Settings icon */}
          <Link
            to="/settings"
            aria-label="Open settings"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              color: 'var(--text-secondary)',
              transition: 'all 150ms ease-in-out',
              textDecoration: 'none',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.backgroundColor = 'var(--bg-subtle)';
              el.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.backgroundColor = 'transparent';
              el.style.color = 'var(--text-secondary)';
            }}
          >
            <Settings size={20} aria-hidden />
          </Link>
        </div>
      </header>
    </>
  );
}

export default Header;
