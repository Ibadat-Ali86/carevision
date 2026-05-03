/**
 * CareVision — TypeScript Analysis Types
 * Spec Reference: Section 8.4
 *
 * All frontend types derived from the backend Pydantic schemas.
 * These mirror backend/app/schemas/analyze.py exactly to ensure
 * schema parity at the API boundary.
 */

// ---------------------------------------------------------------------------
// Primitive Union Types
// ---------------------------------------------------------------------------

export type AnalysisType = 'teststrip' | 'medscan' | 'woundassess' | 'docreader';

/** AI model confidence level — maps to 3-state ConfidenceIndicator component */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** RDT test result — 4 states matching backend TestStripResult */
export type TestResult = 'positive' | 'negative' | 'invalid' | 'unclear';

/** 5-tier severity scale (1=Minor, 5=Emergency) — matches backend SeverityLevel IntEnum */
export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

export type DocumentType =
  | 'lab_report'
  | 'referral_letter'
  | 'prescription'
  | 'patient_record'
  | 'vaccination_card'
  | 'other';

// ---------------------------------------------------------------------------
// Base Interface — All analysis results extend this
// ---------------------------------------------------------------------------

export interface BaseAnalysisResult {
  /** AI model confidence in this result */
  confidence: ConfidenceLevel;
  /**
   * Medical disclaimer injected server-side.
   * Never omit or suppress — regulatory compliance requirement.
   * Source: backend/app/schemas/common.py DISCLAIMER constant.
   */
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Feature-Specific Result Types
// ---------------------------------------------------------------------------

/**
 * TestStrip Reader result — Spec Section 4.2
 * RDT interpretation: malaria, HIV, TB, pregnancy tests
 */
export interface TestStripResult extends BaseAnalysisResult {
  test_type: string;
  result: TestResult;
  /** Description of what lines are visible on the strip */
  line_description: string;
  recommended_action: string;
  next_steps: string[];
}

/**
 * MedScan result — medication identification from packaging
 */
export interface MedScanResult extends BaseAnalysisResult {
  drug_name: string;
  generic_name: string;
  dosage: string;
  indications: string[];
  contraindications: string[];
  common_interactions: string[];
  storage_instructions: string;
}

/**
 * WoundAssess result — Spec Section 4.3
 * 5-level severity scoring with referral trigger
 */
export interface WoundAssessResult extends BaseAnalysisResult {
  wound_type: string;
  /** 1–5 severity level. Uncertainty defaults to 3 (never downgrade) */
  severity: SeverityLevel;
  severity_rationale: string;
  recommended_action: string;
  /** If true, "Generate Referral Card" button must appear */
  refer_immediately: boolean;
  /** null when refer_immediately is false */
  refer_reason: string | null;
  wound_care_steps: string[];
}

/**
 * DocReader result — clinical document extraction
 * Lab reports, prescriptions, vaccination cards, referral letters
 */
export interface DocReaderResult extends BaseAnalysisResult {
  document_type: DocumentType;
  /** Key-value pairs of extracted fields (field name → value) */
  extracted_fields: Record<string, string>;
  summary: string;
  next_steps: string[];
}

// ---------------------------------------------------------------------------
// API Request / Response Envelopes
// ---------------------------------------------------------------------------

export interface AnalysisRequest {
  /** Base64-encoded image (compressed to ≤ 1MB client-side before sending) */
  image_b64: string;
  type: AnalysisType;
  /** ISO 639-1 language code (e.g. 'en', 'fr', 'sw') */
  language: string;
  /** GDPR/privacy gate — must be true to proceed */
  consent_given: boolean;
}

export interface AnalysisResponse<T extends BaseAnalysisResult> {
  type: string;
  result: T;
  processing_time_ms: number;
  model_used: string;
  image_stored: boolean;
  image_url: string | null;
}

// ---------------------------------------------------------------------------
// Protocol Assistant Types
// ---------------------------------------------------------------------------

export interface ProtocolRequest {
  query: string;
  language: string;
  image_b64?: string;
  context?: string;
}

export interface ProtocolResponse {
  answer: string;
  /** Protocol sources referenced in the answer */
  source_note: string;
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Referral Card Types
// ---------------------------------------------------------------------------

/**
 * ReferralRequest — must exactly mirror backend app/schemas/referral.py ReferralRequest.
 * Field mapping from WoundAssess output:
 *   severity           → urgency
 *   severity_rationale → clinical_reason
 *   recommended_action → facility_type_needed
 *   wound_type         → patient_summary (prefixed for clarity)
 */
export interface ReferralRequest {
  patient_summary: string;       // e.g. "Wound: Laceration — <rationale excerpt>"
  urgency: SeverityLevel;        // 1–5, maps to URGENCY_LABELS on backend
  clinical_reason: string;       // severity_rationale from WoundAssess
  facility_type_needed: string;  // recommended_action from WoundAssess
  chw_name?: string;             // optional, defaults to "CHW" on backend
  chw_location?: string;         // optional
}

/** ReferralResponse — mirrors backend app/schemas/referral.py ReferralCard */
export interface ReferralResponse {
  urgency_label: string;         // e.g. "Urgent"
  urgency_color: string;         // hex color e.g. "#D64045"
  patient_summary: string;
  clinical_reason: string;
  facility_type_needed: string;
  referring_chw: string;
  whatsapp_message: string;      // pre-built wa.me deep link (already URL-encoded)
  sms_message: string;           // single-line SMS text (<= 160 chars)
  disclaimer: string;
}
