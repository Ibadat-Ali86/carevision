/**
 * CareVision — ConfidenceIndicator (Analysis Component)
 * Spec Reference: Section 3.2.8
 *
 * 3-state indicator: high (green), medium (amber), low (red)
 * Dot (8px) + label text, right-aligned in ResultCard header
 */

import React from 'react';
import type { ConfidenceLevel } from '@/types/analysis';

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
}

const CONFIG: Record<ConfidenceLevel, { color: string; label: string }> = {
  high:   { color: '#10B981', label: 'High Confidence' },
  medium: { color: '#F59E0B', label: 'Medium Confidence' },
  low:    { color: '#EF4444', label: 'Low Confidence' },
};

export function ConfidenceIndicator({ level }: ConfidenceIndicatorProps) {
  const { color, label } = CONFIG[level];

  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-label={label}
    >
      {/* 8px dot per spec */}
      <div
        className="rounded-full flex-shrink-0"
        aria-hidden
        style={{ width: '8px', height: '8px', backgroundColor: color }}
      />
      <span
        className="text-xs font-medium"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}

export default ConfidenceIndicator;
