/**
 * CareVision — App-Wide TypeScript Types
 * Spec Reference: Section 2.9, 5.1, 5.2
 */

// ---------------------------------------------------------------------------
// Language System
// ---------------------------------------------------------------------------

/** ISO 639-1 language codes — 15 languages per backend spec */
export type LanguageCode =
  | 'en' | 'fr' | 'es' | 'pt' | 'sw'
  | 'ha' | 'am' | 'ar' | 'hi' | 'bn'
  | 'id' | 'tl' | 'vi' | 'my' | 'km';

export interface LanguageOption {
  code: LanguageCode;
  /** Native name */
  name: string;
  /** English name */
  nameEn: string;
}

// ---------------------------------------------------------------------------
// Onboarding System (Spec Section 5.1)
// ---------------------------------------------------------------------------

export type OnboardingStep = 0 | 1 | 2;

export interface OnboardingState {
  completed: boolean;
  currentStep: OnboardingStep;
}

// ---------------------------------------------------------------------------
// Offline Queue System (Spec Section 5.2)
// ---------------------------------------------------------------------------

export type QueueItemStatus = 'pending' | 'retrying' | 'failed' | 'synced';

export interface QueueItem {
  id?: number;
  /** Dexie auto-increment key */
  analysisType: string;
  imageBase64: string;
  language: string;
  timestamp: number;
  /** 0–3 retry count (max 3 per spec) */
  retryCount: number;
  status: QueueItemStatus;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Feature Navigation (Spec Section 4.1)
// ---------------------------------------------------------------------------

export interface Feature {
  id: string;
  name: string;
  description: string;
  /** Lucide icon component name */
  iconName: string;
  route: string;
  /** CSS color value for the icon */
  color: string;
  /** Background color for the icon container */
  bgColor: string;
}

// ---------------------------------------------------------------------------
// Settings Store
// ---------------------------------------------------------------------------

export interface SettingsState {
  language: LanguageCode;
  consentDefault: boolean;
  onboardingCompleted: boolean;
}

// ---------------------------------------------------------------------------
// Analysis Page State Machine (Spec Section 4.2)
// ---------------------------------------------------------------------------

export type AnalysisPageState =
  | 'idle'       // No consent yet
  | 'ready'      // Consent given, awaiting image
  | 'preview'    // Image captured, awaiting confirmation
  | 'analyzing'  // API call in progress
  | 'result'     // Result received
  | 'error';     // API failed
