/**
 * CareVision — MedicalDisclaimer Component
 * Phase 1 of UX improvements per carevision-ux-improvements.md
 *
 * WHY: Generic blue alert pattern does not convey the legal/clinical
 * weight of a medical disclaimer. Clinical Blue + Shield icon establishes
 * appropriate authority; context-aware messaging reduces cognitive load.
 *
 * NEVER make this dismissible — regulatory compliance requirement.
 *
 * Variants:
 *   default   — standard inline use (analysis pages)
 *   compact   — tight spaces (mobile result cards, footers)
 *   prominent — first-time onboarding, consent gates
 *
 * Contexts:
 *   general   — generic CareVision disclaimer
 *   analysis  — AI image analysis specific
 *   protocol  — WHO protocol reference specific
 */

import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface MedicalDisclaimerProps {
  variant?: 'default' | 'compact' | 'prominent';
  context?: 'analysis' | 'protocol' | 'general';
  className?: string;
}

const CONTEXT_MESSAGES = {
  analysis: {
    title: 'AI-Assisted Analysis',
    message:
      'This AI analysis is a clinical decision-support tool. Final diagnosis and treatment decisions must be made by qualified healthcare providers based on complete patient assessment.',
  },
  protocol: {
    title: 'Clinical Protocol Reference',
    message:
      'Protocol guidance is derived from WHO guidelines and regional health ministry standards. Always verify current protocols with your supervising physician or health facility.',
  },
  general: {
    title: 'Medical Decision Support Tool',
    message:
      'CareVision assists clinical decision-making but does not replace professional medical judgment. Consult qualified healthcare providers for diagnosis and treatment decisions.',
  },
} as const;

export function MedicalDisclaimer({
  variant = 'default',
  context = 'general',
  className,
}: MedicalDisclaimerProps) {
  const { title, message } = CONTEXT_MESSAGES[context];

  const containerStyles = {
    default: {
      padding: '0.875rem 1rem',
      borderLeft: '4px solid #2C5F8D',
      borderRadius: '0.625rem',
    },
    compact: {
      padding: '0.625rem 0.875rem',
      borderLeft: '2px solid #2C5F8D',
      borderRadius: '0.5rem',
    },
    prominent: {
      padding: '1.25rem 1.5rem',
      border: '2px solid #2C5F8D',
      borderRadius: '0.75rem',
      boxShadow: '0 4px 14px 0 rgba(44, 95, 141, 0.15)',
    },
  } as const;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn('mb-4', className)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: variant === 'prominent' ? '0.75rem' : '0',
        backgroundColor: 'rgba(44, 95, 141, 0.06)',
        border: variant !== 'prominent' ? '1px solid rgba(44, 95, 141, 0.2)' : undefined,
        ...containerStyles[variant],
      }}
    >
      {/* Main content row */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        {/* Shield icon — conveys legal/clinical protection */}
        <div
          aria-hidden="true"
          style={{
            width: variant === 'compact' ? '24px' : '30px',
            height: variant === 'compact' ? '24px' : '30px',
            borderRadius: '50%',
            backgroundColor: 'rgba(44, 95, 141, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '1px',
          }}
        >
          <Shield
            size={variant === 'compact' ? 13 : 15}
            style={{ color: '#2C5F8D' }}
            aria-hidden
          />
        </div>

        {/* Content */}
        <div>
          <p
            style={{
              fontSize: variant === 'compact' ? '0.75rem' : '0.8125rem',
              fontWeight: 600,
              color: '#1C3D5B',
              marginBottom: '0.25rem',
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontSize: variant === 'compact' ? '0.6875rem' : '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
            }}
          >
            {message}
          </p>
        </div>
      </div>

      {/* Prominent variant footer — additional attention marker */}
      {variant === 'prominent' && (
        <div
          style={{
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(44, 95, 141, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle
            size={13}
            style={{ color: '#D97706', flexShrink: 0 }}
            aria-hidden
          />
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: '#1C3D5B',
            }}
          >
            This information supports but does not replace clinical judgment
          </span>
        </div>
      )}
    </div>
  );
}

export default MedicalDisclaimer;
