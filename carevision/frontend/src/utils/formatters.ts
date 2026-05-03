/**
 * CareVision — Formatters Utility
 * Spec Reference: Section 8.3 (Utility Functions)
 *
 * Pure formatting functions — no side effects, no DOM access.
 * Used across ResultCard, PatientLog, SeverityBadge.
 */

import type { SeverityLevel, AnalysisType } from '@/types/analysis';

// ---------------------------------------------------------------------------
// Severity
// ---------------------------------------------------------------------------

/** Maps SeverityLevel (1–5) to human-readable label. */
export function severityToLabel(level: SeverityLevel | number): string {
  const labels: Record<number, string> = {
    1: 'Minor',
    2: 'Mild',
    3: 'Moderate',
    4: 'Serious',
    5: 'Emergency',
  };
  return labels[level] ?? 'Unknown';
}

/** Maps SeverityLevel to a CSS hex color for badges and borders. */
export function severityToColor(level: SeverityLevel | number): string {
  const colors: Record<number, string> = {
    1: '#27A769',
    2: '#F4A819',
    3: '#E07B00',
    4: '#D64045',
    5: '#9B1B30',
  };
  return colors[level] ?? '#94A3B8';
}

// ---------------------------------------------------------------------------
// Analysis Types
// ---------------------------------------------------------------------------

/** Maps internal analysis type key to display name. */
export function analysisTypeToName(type: AnalysisType | string): string {
  const names: Record<string, string> = {
    teststrip:   'TestStrip Reader',
    medscan:     'MedScan',
    woundassess: 'WoundAssess',
    docreader:   'DocReader',
  };
  return names[type] ?? type.replace(/_/g, ' ');
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/**
 * Formats an ISO 8601 timestamp to a readable clinical display format.
 * Output: "May 2, 2026 — 14:35"
 *
 * TRADEOFF: Uses Intl.DateTimeFormat (native) instead of date-fns to avoid
 * bundle cost for a single format pattern. PatientLog uses date-fns for
 * consistency because it already imports the library for other formatting.
 */
export function formatClinicalDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Returns relative time string for recent events (e.g. "2 hours ago"). */
export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const intervals: [number, string][] = [
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}
