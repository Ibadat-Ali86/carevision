/**
 * CareVision — Footer (Layout Component)
 * Spec Reference: Section 3.1 (Component Hierarchy)
 *
 * Visible on all breakpoints. Contains CareVision branding,
 * Gemma AI badge, and license info.
 */

import React from 'react';
import { Stethoscope, Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer
      role="contentinfo"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-default)',
        marginTop: 'auto',
      }}
    >
      <div
        className="mx-auto px-4 sm:px-6"
        style={{ maxWidth: '1280px', padding: '1.25rem 1rem' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #0A6E5C 0%, #0F9D7E 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Stethoscope size={13} color="#FFFFFF" aria-hidden />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              CareVision
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              v1.0.0 · Apache 2.0
            </span>
          </div>

          {/* Powered by Gemma */}
          <div
            className="flex items-center gap-1.5"
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'var(--bg-interactive)',
              border: '1px solid rgba(10, 110, 92, 0.2)',
            }}
          >
            <Zap size={12} aria-hidden style={{ color: '#0A6E5C' }} />
            <span className="text-xs font-medium" style={{ color: '#0A6E5C' }}>
              Powered by Gemma 3n AI
            </span>
          </div>

          {/* Tagline */}
          <p className="text-xs text-center sm:text-right" style={{ color: 'var(--text-tertiary)' }}>
            Clinical clarity for the last mile.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
