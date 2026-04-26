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
  const payload = {
    ...req,
    image_b64: req.image_b64.includes(',') ? req.image_b64.split(',')[1] : req.image_b64
  };
  const { data } = await apiClient.post<AnalysisResponse<TestStripResult>>(
    '/analyze/',
    payload
  );
  return data;
}

export async function analyzeMedScan(
  req: AnalysisRequest
): Promise<AnalysisResponse<MedScanResult>> {
  const payload = {
    ...req,
    image_b64: req.image_b64.includes(',') ? req.image_b64.split(',')[1] : req.image_b64
  };
  const { data } = await apiClient.post<AnalysisResponse<MedScanResult>>(
    '/analyze/',
    payload
  );
  return data;
}

export async function analyzeWoundAssess(
  req: AnalysisRequest
): Promise<AnalysisResponse<WoundAssessResult>> {
  const payload = {
    ...req,
    image_b64: req.image_b64.includes(',') ? req.image_b64.split(',')[1] : req.image_b64
  };
  const { data } = await apiClient.post<AnalysisResponse<WoundAssessResult>>(
    '/analyze/',
    payload
  );
  return data;
}

export async function analyzeDocReader(
  req: AnalysisRequest
): Promise<AnalysisResponse<DocReaderResult>> {
  const payload = {
    ...req,
    image_b64: req.image_b64.includes(',') ? req.image_b64.split(',')[1] : req.image_b64
  };
  const { data } = await apiClient.post<AnalysisResponse<DocReaderResult>>(
    '/analyze/',
    payload
  );
  return data;
}

// ---------------------------------------------------------------------------
// Protocol Assistant Endpoint
// ---------------------------------------------------------------------------

export async function queryProtocol(
  req: ProtocolRequest
): Promise<ProtocolResponse> {
  const { data } = await apiClient.post<ProtocolResponse>('/protocols/', req);
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
