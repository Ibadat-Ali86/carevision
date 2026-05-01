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
// Shared base64 strip helper
// Backend expects raw base64 without the "data:image/...;base64," prefix
// ---------------------------------------------------------------------------
function stripDataUri(b64: string): string {
  return b64.includes(',') ? b64.split(',')[1] : b64;
}

// ---------------------------------------------------------------------------
// Analysis Endpoints
// ---------------------------------------------------------------------------

export async function analyzeTestStrip(
  req: AnalysisRequest
): Promise<AnalysisResponse<TestStripResult>> {
  const { data } = await apiClient.post<AnalysisResponse<TestStripResult>>(
    '/analyze/teststrip',
    { ...req, image_b64: stripDataUri(req.image_b64) }
  );
  return data;
}

export async function analyzeMedScan(
  req: AnalysisRequest
): Promise<AnalysisResponse<MedScanResult>> {
  const { data } = await apiClient.post<AnalysisResponse<MedScanResult>>(
    '/analyze/medscan',
    { ...req, image_b64: stripDataUri(req.image_b64) }
  );
  return data;
}

export async function analyzeWoundAssess(
  req: AnalysisRequest
): Promise<AnalysisResponse<WoundAssessResult>> {
  const { data } = await apiClient.post<AnalysisResponse<WoundAssessResult>>(
    '/analyze/woundassess',
    { ...req, image_b64: stripDataUri(req.image_b64) }
  );
  return data;
}

export async function analyzeDocReader(
  req: AnalysisRequest
): Promise<AnalysisResponse<DocReaderResult>> {
  const { data } = await apiClient.post<AnalysisResponse<DocReaderResult>>(
    '/analyze/docreader',
    { ...req, image_b64: stripDataUri(req.image_b64) }
  );
  return data;
}

// ---------------------------------------------------------------------------
// Protocol Assistant Endpoint
// ---------------------------------------------------------------------------

export async function queryProtocol(req: ProtocolRequest): Promise<ProtocolResponse> {
  const { data } = await apiClient.post<ProtocolResponse>('/protocols/', req);
  return data;
}

// ---------------------------------------------------------------------------
// Referral Card Endpoint
// FIX: Backend APIRouter prefix="/referral" + route "/" → POST /referral/
// Previous code incorrectly called /referral/generate (404)
// ---------------------------------------------------------------------------

export async function generateReferral(req: ReferralRequest): Promise<ReferralResponse> {
  const { data } = await apiClient.post<ReferralResponse>('/referral/', req);
  return data;
}

// ---------------------------------------------------------------------------
// Patient Log Endpoints
// FIX: GET /log/encounters does not exist — backend is /log/{location_code}
// ---------------------------------------------------------------------------

export interface EncounterLogCreate {
  analysis_type: string;
  result_json: Record<string, unknown>;
  severity?: number | null;
  refer_immediately?: boolean;
  consent_given: boolean;
  image_url?: string | null;
  chw_notes?: string | null;
  location_code?: string | null;
  model_used?: string | null;
  processing_time_ms?: number | null;
}

export interface EncounterLogRead extends EncounterLogCreate {
  id: string;
  created_at: string;
}

/** POST /log/ — saves a CHW encounter. Must be user-triggered; never auto-called. */
export async function saveEncounter(req: EncounterLogCreate): Promise<EncounterLogRead> {
  const payload = {
    ...req,
    result_json: JSON.stringify(req.result_json),
  };
  const { data } = await apiClient.post<any>('/log/', payload);
  return {
    ...data,
    result_json: typeof data.result_json === 'string' ? JSON.parse(data.result_json) : data.result_json,
  };
}

/** GET /log/{location_code} — fetches 50 most-recent encounters for a location. */
export async function fetchEncounters(locationCode: string): Promise<EncounterLogRead[]> {
  if (!locationCode.trim()) return [];
  const { data } = await apiClient.get<{ encounters: any[]; count: number }>(
    `/log/${encodeURIComponent(locationCode)}`
  );
  return data.encounters.map((e: any) => ({
    ...e,
    result_json: typeof e.result_json === 'string' ? JSON.parse(e.result_json) : e.result_json,
  }));
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
