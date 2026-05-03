/**
 * CareVision — SeverityBadge (Analysis Component)
 * Spec Reference: Section 3.2.7
 *
 * Polymorphic badge for both:
 *   - Test results: positive / negative / invalid / unclear
 *   - Wound severity: 1 (Minor) through 5 (Emergency)
 *
 * 3 sizes: small | medium | large
 * 8 visual variants — all tested for WCAG 2.1 AA contrast
 */

import React from 'react';
import {
  Check,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import type { SeverityLevel, TestResult } from '@/types/analysis';

// ---------------------------------------------------------------------------
// Config Maps
// ---------------------------------------------------------------------------

type BadgeConfig = {
  Icon: React.ElementType;
  bgColor: string;
  textColor: string;
  borderColor: string;
  defaultLabel: string;
};

const SEVERITY_CONFIG: Record<number, BadgeConfig> = {
  1: {
    Icon: Check,
    bgColor: 'rgba(16, 185, 129, 0.1)',
    textColor: '#047857',
    borderColor: '#10B981',
    defaultLabel: 'Minor',
  },
  2: {
    Icon: Check,
    bgColor: 'rgba(16, 185, 129, 0.1)',
    textColor: '#047857',
    borderColor: '#10B981',
    defaultLabel: 'Mild',
  },
  3: {
    Icon: AlertTriangle,
    bgColor: 'rgba(245, 158, 11, 0.1)',
    textColor: '#B45309',
    borderColor: '#F59E0B',
    defaultLabel: 'Moderate',
  },
  4: {
    Icon: AlertTriangle,
    bgColor: 'rgba(239, 68, 68, 0.1)',
    textColor: '#B91C1C',
    borderColor: '#EF4444',
    defaultLabel: 'Serious',
  },
  5: {
    Icon: AlertOctagon,
    // Spec: Severity 5 uses solid dark red bg with white text for 8.3:1 contrast (AAA)
    bgColor: '#991B1B',
    textColor: '#FFFFFF',
    borderColor: '#991B1B',
    defaultLabel: 'Emergency',
  },
};

const RESULT_CONFIG: Record<TestResult, BadgeConfig> = {
  positive: {
    Icon: AlertCircle,
    bgColor: 'rgba(239, 68, 68, 0.1)',
    textColor: '#B91C1C',
    borderColor: '#EF4444',
    defaultLabel: 'Positive',
  },
  negative: {
    Icon: CheckCircle,
    bgColor: 'rgba(16, 185, 129, 0.1)',
    textColor: '#047857',
    borderColor: '#10B981',
    defaultLabel: 'Negative',
  },
  invalid: {
    Icon: XCircle,
    bgColor: 'rgba(245, 158, 11, 0.1)',
    textColor: '#B45309',
    borderColor: '#F59E0B',
    defaultLabel: 'Invalid',
  },
  unclear: {
    Icon: HelpCircle,
    bgColor: 'rgba(100, 116, 139, 0.1)',
    textColor: '#334155',
    borderColor: '#64748B',
    defaultLabel: 'Unclear',
  },
};

// ---------------------------------------------------------------------------
// Size Maps
// ---------------------------------------------------------------------------

const SIZE_HEIGHT: Record<string, string> = {
  small:  '24px',
  medium: '32px',
  large:  '40px',
};

const SIZE_TEXT: Record<string, string> = {
  small:  '0.75rem',
  medium: '0.875rem',
  large:  '1rem',
};

const SIZE_ICON: Record<string, number> = {
  small:  14,
  medium: 18,
  large:  22,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SeverityBadgeProps {
  /** Wound severity level 1–5 (mutually exclusive with result) */
  severity?: SeverityLevel;
  /** Test strip result (mutually exclusive with severity) */
  result?: TestResult;
  size?: 'small' | 'medium' | 'large';
  /** Override the auto-generated label */
  label?: string;
}

export function SeverityBadge({
  severity,
  result,
  size = 'medium',
  label,
}: SeverityBadgeProps) {
  // Resolve config — severity takes precedence if both provided
  const config: BadgeConfig | undefined =
    severity !== undefined
      ? SEVERITY_CONFIG[severity]
      : result !== undefined
        ? RESULT_CONFIG[result]
        : undefined;

  if (!config) return null;

  const { Icon, bgColor, textColor, borderColor, defaultLabel } = config;
  const iconSize = SIZE_ICON[size];

  return (
    <div
      className="inline-flex items-center gap-2 px-3 rounded-full font-semibold"
      style={{
        height: SIZE_HEIGHT[size],
        fontSize: SIZE_TEXT[size],
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
      }}
    >
      <Icon size={iconSize} aria-hidden />
      <span>{label ?? defaultLabel}</span>
    </div>
  );
}

export default SeverityBadge;
