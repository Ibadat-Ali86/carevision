/**
 * CareVision — ConsentToggle (Shared Component)
 * Spec Reference: Section 3.2.4
 *
 * Explicit user consent gate before analysis (GDPR/privacy compliance).
 * Analysis button remains disabled until checked.
 *
 * Uses Radix UI Switch for accessible toggle semantics.
 * Background color transitions from neutral to teal-tint when checked.
 */

import React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { ShieldCheck } from 'lucide-react';

interface ConsentToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ConsentToggle({ checked, onChange }: ConsentToggleProps) {
  return (
    <div
      className="mb-5"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.875rem',
        padding: '1rem',
        borderRadius: '0.625rem',
        backgroundColor: checked ? 'rgba(10, 110, 92, 0.06)' : 'var(--bg-subtle)',
        border: `1px solid ${checked ? 'rgba(10, 110, 92, 0.25)' : 'var(--border-default)'}`,
        transition: 'background-color 200ms ease-in-out, border-color 200ms ease-in-out',
      }}
    >
      {/* Privacy Icon */}
      <ShieldCheck
        size={20}
        aria-hidden
        style={{
          color: checked ? '#0A6E5C' : 'var(--text-tertiary)',
          marginTop: '2px',
          flexShrink: 0,
          transition: 'color 200ms ease-in-out',
        }}
      />

      {/* Label */}
      <label
        htmlFor="consent-toggle"
        className="cursor-pointer select-none flex-1"
      >
        <p
          className="font-medium"
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            marginBottom: '0.25rem',
          }}
        >
          I consent to processing this image for clinical analysis.
        </p>
        <p
          id="consent-description"
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            lineHeight: '1.55',
          }}
        >
          No patient-identifiable information will be stored without explicit
          consent. Images are analyzed and discarded unless storage is enabled.
        </p>
      </label>

      {/* Radix Switch — role="switch" + aria-checked */}
      <SwitchPrimitive.Root
        id="consent-toggle"
        checked={checked}
        onCheckedChange={onChange}
        aria-describedby="consent-description"
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '9999px',
          backgroundColor: checked ? '#0A6E5C' : '#CBD5E1',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          flexShrink: 0,
          marginTop: '2px',
          transition: 'background-color 200ms ease-in-out',
          boxShadow: checked ? '0 2px 8px rgba(10,110,92,0.35)' : 'none',
        }}
      >
        <SwitchPrimitive.Thumb
          style={{
            display: 'block',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            transform: checked ? 'translateX(23px)' : 'translateX(3px)',
            marginTop: '3px',
            transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}

export default ConsentToggle;
