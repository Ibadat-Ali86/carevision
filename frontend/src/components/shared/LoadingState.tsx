/**
 * CareVision — LoadingState (Shared Component)
 * Spec Reference: Section 2.1 (skeleton screens, not spinners)
 *
 * WHY skeleton screens: Preserves layout stability (avoids CLS) and
 * reduces perceived wait time vs. a spinner. Matches result card shape.
 *
 * Features a teal progress bar animation at the top and Gemma AI branding.
 */

import React from 'react';
import { Zap } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Analyzing...' }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      style={{ animation: 'fadeIn 200ms ease-in-out' }}
    >
      {/* Gemma AI status indicator */}
      <div
        className="flex items-center justify-center gap-2 mb-5"
        style={{
          padding: '0.625rem 1rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(10, 110, 92, 0.08)',
          border: '1px solid rgba(10, 110, 92, 0.2)',
          display: 'inline-flex',
          margin: '0 auto 1.25rem',
          width: 'fit-content',
        }}
      >
        <Zap size={14} aria-hidden style={{ color: '#0A6E5C' }} />
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#0A6E5C',
          }}
        >
          {message}
        </span>
        {/* Animated dots */}
        <span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: '#0A6E5C',
                display: 'inline-block',
                animation: `statusDot 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </span>
      </div>

      {/* Skeleton card mimicking ResultCard layout */}
      <div
        style={{
          border: '1px solid var(--border-default)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          backgroundColor: 'var(--bg-elevated)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Animated teal progress bar at top */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '3px',
            backgroundColor: '#0A6E5C',
            borderRadius: '0 0 2px 0',
            animation: 'progressBar 2.5s ease-in-out forwards',
            opacity: 0.85,
          }}
        />

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
            <div className="skeleton" style={{ width: '140px', height: '20px' }} />
          </div>
          <div className="skeleton" style={{ width: '90px', height: '16px', borderRadius: '9999px' }} />
        </div>

        {/* Badge */}
        <div className="skeleton" style={{ width: '130px', height: '36px', borderRadius: '9999px', marginBottom: '1rem' }} />

        {/* Body section */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="skeleton" style={{ width: '100px', height: '12px', marginBottom: '0.625rem' }} />
          <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ width: '90%', height: '14px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ width: '75%', height: '14px' }} />
        </div>

        {/* Section heading */}
        <div className="skeleton" style={{ width: '120px', height: '12px', marginBottom: '0.75rem' }} />

        {/* List items */}
        <div style={{ marginBottom: '1.25rem' }}>
          {[100, 95, 88, 80].map((w, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: `${w}%`, height: '12px', marginBottom: '0.5rem' }}
            />
          ))}
        </div>

        {/* Disclaimer block */}
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-subtle)',
          }}
        >
          <div className="skeleton" style={{ width: '100%', height: '10px', marginBottom: '0.375rem' }} />
          <div className="skeleton" style={{ width: '80%', height: '10px' }} />
        </div>
      </div>

      {/* Visually hidden live region */}
      <div className="sr-only" aria-live="assertive">
        {message} Please wait while Gemma AI processes the image.
      </div>
    </div>
  );
}

export default LoadingState;
