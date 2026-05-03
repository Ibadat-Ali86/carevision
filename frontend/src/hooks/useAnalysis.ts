/**
 * CareVision — TanStack Query Analysis Hooks
 * Spec Reference: Section 8.6
 *
 * WHY useMutation: Analysis is a command (side effect), not a query.
 * TanStack Query's mutation handling provides: loading state, error state,
 * optimistic updates, and retry logic out of the box.
 *
 * Retry strategy: exponential backoff (1s → 2s → 4s, capped at 30s).
 * After max retries exhausted, error is surfaced to the page component
 * which then enqueues the request for offline sync.
 */

import { useMutation } from '@tanstack/react-query';
import type {
  AnalysisRequest,
  TestStripResult,
  MedScanResult,
  WoundAssessResult,
  DocReaderResult,
  ProtocolRequest,
  ReferralRequest,
} from '@/types/analysis';
import {
  analyzeTestStrip,
  analyzeMedScan,
  analyzeWoundAssess,
  analyzeDocReader,
  queryProtocol,
  generateReferral,
} from '@/api/endpoints';
import { API_MAX_RETRIES } from '@/constants/api';

// WHY: Exponential backoff with cap — prevents thundering-herd on flaky connections
const retryDelay = (attempt: number): number =>
  Math.min(1000 * 2 ** attempt, 30_000);

// ---------------------------------------------------------------------------
// Analysis Mutation Hooks
// ---------------------------------------------------------------------------

export function useTestStripAnalysis() {
  return useMutation({
    mutationFn: analyzeTestStrip,
    retry: API_MAX_RETRIES,
    retryDelay,
  });
}

export function useMedScanAnalysis() {
  return useMutation({
    mutationFn: analyzeMedScan,
    retry: API_MAX_RETRIES,
    retryDelay,
  });
}

export function useWoundAssessAnalysis() {
  return useMutation({
    mutationFn: analyzeWoundAssess,
    retry: API_MAX_RETRIES,
    retryDelay,
  });
}

export function useDocReaderAnalysis() {
  return useMutation({
    mutationFn: analyzeDocReader,
    retry: API_MAX_RETRIES,
    retryDelay,
  });
}

// ---------------------------------------------------------------------------
// Protocol Assistant Hook
// ---------------------------------------------------------------------------

export function useProtocolQuery() {
  return useMutation({
    mutationFn: queryProtocol,
    retry: 1,
    retryDelay,
  });
}

// ---------------------------------------------------------------------------
// Referral Generation Hook
// ---------------------------------------------------------------------------

export function useGenerateReferral() {
  return useMutation({
    mutationFn: generateReferral,
    retry: API_MAX_RETRIES,
    retryDelay,
  });
}

// ---------------------------------------------------------------------------
// Generic Analysis Hook (used by analysis pages to pick the right mutator)
// ---------------------------------------------------------------------------

export type AnalysisResult = TestStripResult | MedScanResult | WoundAssessResult | DocReaderResult;

export function useAnalysis(type: AnalysisRequest['type']) {
  const testStrip   = useTestStripAnalysis();
  const medScan     = useMedScanAnalysis();
  const woundAssess = useWoundAssessAnalysis();
  const docReader   = useDocReaderAnalysis();

  const hooks = {
    teststrip:   testStrip,
    medscan:     medScan,
    woundassess: woundAssess,
    docreader:   docReader,
  };

  return hooks[type];
}
