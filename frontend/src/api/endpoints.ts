/**
 * CareVision — API Endpoints
 * Spec Reference: Section 8.5, Backend routes
 *
 * All API calls go through this module — never call apiClient directly from pages.
 * This ensures a single point of change if backend URLs shift.
 */

import { apiClient } from './client';
import type {
  AnalysisRequest,
  AnalysisResponse,
  TestStripResult,
  MedScanResult,
  WoundAssessResult,
  DocReaderResult,
  ProtocolRequest,
  ProtocolResponse,
  ReferralRequest,
  ReferralResponse,
} from '@/types/analysis';

// ---------------------------------------------------------------------------
// Analysis Endpoints
// ---------------------------------------------------------------------------

export async function analyzeTestStrip(
  req: AnalysisRequest
): Promise<AnalysisResponse<TestStripResult>> {
  const { data } = await apiClient.post<AnalysisResponse<TestStripResult>>(
    '/analyze/teststrip',
    req
  );
  return data;
}

export async function analyzeMedScan(
  req: AnalysisRequest
): Promise<AnalysisResponse<MedScanResult>> {
  const { data } = await apiClient.post<AnalysisResponse<MedScanResult>>(
    '/analyze/medscan',
    req
  );
  return data;
}

export async function analyzeWoundAssess(
  req: AnalysisRequest
): Promise<AnalysisResponse<WoundAssessResult>> {
  const { data } = await apiClient.post<AnalysisResponse<WoundAssessResult>>(
    '/analyze/woundassess',
    req
  );
  return data;
}

export async function analyzeDocReader(
  req: AnalysisRequest
): Promise<AnalysisResponse<DocReaderResult>> {
  const { data } = await apiClient.post<AnalysisResponse<DocReaderResult>>(
    '/analyze/docreader',
    req
  );
  return data;
}

// ---------------------------------------------------------------------------
// Protocol Assistant Endpoint
// ---------------------------------------------------------------------------

export async function queryProtocol(
  req: ProtocolRequest
): Promise<ProtocolResponse> {
  const { data } = await apiClient.post<ProtocolResponse>('/protocols/query', req);
  return data;
}

// ---------------------------------------------------------------------------
// Referral Card Endpoint
// ---------------------------------------------------------------------------

export async function generateReferral(
  req: ReferralRequest
): Promise<ReferralResponse> {
  const { data } = await apiClient.post<ReferralResponse>('/referral/generate', req);
  return data;
}

// ---------------------------------------------------------------------------
// Health Check (used by OfflineIndicator to verify backend reachability)
// ---------------------------------------------------------------------------

export async function checkHealth(): Promise<boolean> {
  try {
    await apiClient.get('/health', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
