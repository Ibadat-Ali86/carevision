/**
 * CareVision — DisclaimerBanner (Shared Component)
 * Spec Reference: Section 3.2.3
 *
 * Mandatory medical disclaimer displayed on every analysis page.
 * NEVER omit or make dismissible — regulatory compliance requirement.
 *
 * role="alert" + aria-live="polite" ensures screen readers announce it on mount.
 */

import React from 'react';
import { Info } from 'lucide-react';

export function DisclaimerBanner() {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="mb-5"
      style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        borderRadius: '0.625rem',
        backgroundColor: 'rgba(59, 130, 246, 0.06)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderLeft: '4px solid #3B82F6',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        <Info size={14} aria-hidden style={{ color: '#3B82F6' }} />
      </div>

      <div>
        <p
          className="font-semibold mb-0.5"
          style={{ color: '#1E3A5F', fontSize: '0.8125rem' }}
        >
          Medical Disclaimer
        </p>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            lineHeight: '1.6',
          }}
        >
          CareVision is a decision-support tool, not a replacement for professional
          medical judgment. Always consult qualified healthcare providers for
          diagnosis and treatment decisions.
        </p>
      </div>
    </div>
  );
}

export default DisclaimerBanner;
