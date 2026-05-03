/**
 * CareVision — ResultCard (Polymorphic Analysis Component)
 * Spec Reference: Section 3.2.6
 *
 * Renders type-specific content based on analysisType prop.
 * Shared structure: Confidence indicator (top-right) + type content + disclaimer + actions.
 *
 * IMPROVEMENTS:
 * - Added "Save to Log" button (spec requirement: explicit CHW-triggered save)
 * - Added toast-style save feedback (success / already-saved / error states)
 * - Extracted getSeverityLabel to shared formatters.ts
 * - Sub-components for each analysis type are co-located for dispatch clarity
 */

import React, { useState, useCallback } from 'react';
import {
  ClipboardCheck,
  Pill,
  Heart,
  FileText,
  Share2,
  AlertTriangle,
  RefreshCw,
  Phone,
  BookmarkPlus,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { SeverityBadge } from './SeverityBadge';
import { saveEncounter } from '@/api/endpoints';
import { useSettingsStore } from '@/store/settingsStore';
import type {
  AnalysisType,
  TestStripResult,
  MedScanResult,
  WoundAssessResult,
  DocReaderResult,
} from '@/types/analysis';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AnyResult = TestStripResult | MedScanResult | WoundAssessResult | DocReaderResult;

interface ResultCardProps {
  analysisType: AnalysisType;
  result: AnyResult;
  onExport?: () => void;
  onNewAnalysis?: () => void;
  /** Trigger follow-up Protocol Assistant question with context */
  onAskFollowUp?: () => void;
  /** Only for WoundAssess: trigger referral card generation */
  onGenerateReferral?: () => void;
  /** Processing metadata from AnalyzeResponse for log persistence */
  processingTimeMs?: number;
  modelUsed?: string;
  imageUrl?: string | null;
}

// ---------------------------------------------------------------------------
// Icon / Label / Color Maps
// ---------------------------------------------------------------------------
const ANALYSIS_ICON: Record<AnalysisType, React.ElementType> = {
  teststrip:   ClipboardCheck,
  medscan:     Pill,
  woundassess: Heart,
  docreader:   FileText,
};

const ANALYSIS_TITLE: Record<AnalysisType, string> = {
  teststrip:   'TestStrip Analysis',
  medscan:     'MedScan Analysis',
  woundassess: 'WoundAssess',
  docreader:   'DocReader Analysis',
};

const ANALYSIS_ACCENT: Record<AnalysisType, string> = {
  teststrip:   '#0A6E5C',
  medscan:     '#2C5F8D',
  woundassess: '#F59E0B',
  docreader:   '#334155',
};

const ANALYSIS_ICON_BG: Record<AnalysisType, string> = {
  teststrip:   '#E6F7F4',
  medscan:     '#E8F1F8',
  woundassess: 'rgba(245,158,11,0.1)',
  docreader:   '#F1F5F9',
};

// ---------------------------------------------------------------------------
// Type-Specific Sub-Components
// ---------------------------------------------------------------------------

function TestStripResultContent({ result }: { result: TestStripResult }) {
  return (
    <>
      <div className="mb-4">
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Test Type</p>
        <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>{result.test_type}</p>
      </div>

      <div className="mb-4">
        <SeverityBadge result={result.result} size="large" />
      </div>

      <div className="mb-4 rounded-md" style={{ padding: 'var(--space-4)', backgroundColor: 'var(--bg-subtle)' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>What to Verify</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{result.line_description}</p>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Recommended Action</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{result.recommended_action}</p>
      </div>

      {result.next_steps.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Next Steps</p>
          <ol className="list-decimal list-inside space-y-1">
            {result.next_steps.map((step, idx) => (
              <li key={idx} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}

function MedScanResultContent({ result }: { result: MedScanResult }) {
  return (
    <>
      <div className="mb-4">
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Drug Name</p>
        <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{result.drug_name}</p>
        {result.generic_name && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Generic: {result.generic_name}</p>
        )}
      </div>

      <div className="mb-4 rounded-md" style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-subtle)' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>Dosage</p>
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{result.dosage}</p>
      </div>

      {result.indications.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Indications</p>
          <ul className="list-disc list-inside space-y-1">
            {result.indications.map((item, idx) => (
              <li key={idx} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {result.contraindications.length > 0 && (
        <div className="mb-4 rounded-md" style={{ padding: 'var(--space-3)', backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#B91C1C' }}>Contraindications</p>
          <ul className="list-disc list-inside space-y-1">
            {result.contraindications.map((item, idx) => (
              <li key={idx} className="text-sm" style={{ color: '#B91C1C' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {result.common_interactions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Common Interactions</p>
          <ul className="list-disc list-inside space-y-1">
            {result.common_interactions.map((item, idx) => (
              <li key={idx} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-md" style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-subtle)' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>Storage Instructions</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{result.storage_instructions}</p>
      </div>
    </>
  );
}

function WoundAssessResultContent({
  result,
  onGenerateReferral,
}: {
  result: WoundAssessResult;
  onGenerateReferral?: () => void;
}) {
  const severityLabel = ['', 'Minor', 'Mild', 'Moderate', 'Serious', 'Emergency'][result.severity] ?? 'Unknown';

  return (
    <>
      <div className="mb-4">
        <SeverityBadge
          severity={result.severity}
          size="large"
          label={`Severity ${result.severity} — ${severityLabel}`}
        />
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Wound Type</p>
        <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>{result.wound_type}</p>
      </div>

      <div className="mb-4 rounded-md" style={{ padding: 'var(--space-4)', backgroundColor: 'var(--bg-subtle)' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>Assessment Rationale</p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.severity_rationale}</p>
      </div>

      {result.refer_immediately && (
        <div
          className="mb-4 rounded-md flex items-start gap-3"
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'rgba(239,68,68,0.08)',
            borderLeft: result.severity === 5 ? '8px solid #991B1B' : '4px solid #EF4444',
            borderTopRightRadius: 'var(--radius-md)',
            borderBottomRightRadius: 'var(--radius-md)',
          }}
        >
          <AlertTriangle
            size={24}
            className={result.severity === 5 ? 'animate-pulse-slow flex-shrink-0 mt-0.5' : 'flex-shrink-0 mt-0.5'}
            aria-hidden
            style={{ color: result.severity === 5 ? '#991B1B' : '#EF4444' }}
          />
          <div>
            <p className="text-base font-semibold mb-1" style={{ color: result.severity === 5 ? '#991B1B' : '#B91C1C' }}>
              {result.severity === 5 ? 'CALL EMERGENCY SERVICES IMMEDIATELY' : 'Immediate Referral Required'}
            </p>
            {result.refer_reason && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{result.refer_reason}</p>
            )}
          </div>
        </div>
      )}

      {result.wound_care_steps.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Immediate Care Steps</p>
          <ol className="list-decimal list-inside space-y-2">
            {result.wound_care_steps.map((step, idx) => (
              <li key={idx} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {result.refer_immediately && (
        <div className="flex flex-col gap-2 mt-4">
          {result.severity === 5 && (
            <a href="tel:112" className="btn-danger w-full text-center">
              <Phone size={18} aria-hidden /> Call Emergency (112)
            </a>
          )}
          <button onClick={onGenerateReferral} type="button" className="btn-primary w-full">
            <FileText size={18} aria-hidden /> Generate Referral Card
          </button>
        </div>
      )}
    </>
  );
}

function DocReaderResultContent({ result }: { result: DocReaderResult }) {
  return (
    <>
      <div className="mb-4 rounded-md" style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-subtle)' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>Document Type</p>
        <p className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
          {result.document_type.replace(/_/g, ' ')}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Summary</p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.summary}</p>
      </div>

      {Object.keys(result.extracted_fields).length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Extracted Fields</p>
          <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
            {Object.entries(result.extracted_fields).map(([key, value], idx) => (
              <div
                key={key}
                className="flex gap-4 text-sm"
                style={{
                  padding: '10px 12px',
                  backgroundColor: idx % 2 === 0 ? 'var(--bg-elevated)' : 'var(--bg-subtle)',
                  borderBottom: idx < Object.keys(result.extracted_fields).length - 1
                    ? '1px solid var(--border-subtle)'
                    : 'none',
                }}
              >
                <span className="font-medium flex-shrink-0" style={{ color: 'var(--text-secondary)', minWidth: '140px' }}>
                  {key}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {typeof value === 'object' && value !== null
                    ? JSON.stringify(value, null, 2)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.next_steps.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Next Steps</p>
          <ol className="list-decimal list-inside space-y-1">
            {result.next_steps.map((step, idx) => (
              <li key={idx} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Save State Type
// ---------------------------------------------------------------------------
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// ---------------------------------------------------------------------------
// Main ResultCard Component
// ---------------------------------------------------------------------------

export function ResultCard({
  analysisType,
  result,
  onExport,
  onNewAnalysis,
  onAskFollowUp,
  onGenerateReferral,
  processingTimeMs,
  modelUsed,
  imageUrl,
}: ResultCardProps) {
  const AnalysisIcon = ANALYSIS_ICON[analysisType];
  const { locationCode } = useSettingsStore();
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const handleSaveToLog = useCallback(async () => {
    if (saveState === 'saved' || saveState === 'saving') return;
    setSaveState('saving');

    // Extract severity if it's a WoundAssessResult
    const severity = 'severity' in result ? (result as WoundAssessResult).severity : undefined;
    const referImmediately = 'refer_immediately' in result
      ? (result as WoundAssessResult).refer_immediately
      : undefined;

    try {
      await saveEncounter({
        analysis_type: analysisType,
        result_json: result as unknown as Record<string, unknown>,
        severity: severity ?? null,
        refer_immediately: referImmediately,
        consent_given: true, // ResultCard only renders after explicit consent
        image_url: imageUrl ?? null,
        location_code: locationCode || null,
        model_used: modelUsed ?? null,
        processing_time_ms: processingTimeMs ?? null,
      });
      setSaveState('saved');
    } catch {
      setSaveState('error');
      // Auto-reset error state after 3s so user can retry
      setTimeout(() => setSaveState('idle'), 3000);
    }
  }, [analysisType, result, locationCode, imageUrl, modelUsed, processingTimeMs, saveState]);

  const renderContent = () => {
    switch (analysisType) {
      case 'teststrip':
        return <TestStripResultContent result={result as TestStripResult} />;
      case 'medscan':
        return <MedScanResultContent result={result as MedScanResult} />;
      case 'woundassess':
        return (
          <WoundAssessResultContent
            result={result as WoundAssessResult}
            onGenerateReferral={onGenerateReferral}
          />
        );
      case 'docreader':
        return <DocReaderResultContent result={result as DocReaderResult} />;
    }
  };

  const accent = ANALYSIS_ACCENT[analysisType];
  const iconBg = ANALYSIS_ICON_BG[analysisType];

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 16px -4px rgb(0 0 0 / 0.1), 0 2px 6px -2px rgb(0 0 0 / 0.07)',
        padding: '1.5rem',
        border: '1px solid #E2E8F0',
        borderLeft: `4px solid ${accent}`,
        animation: 'slideUpFadeIn 350ms ease-out both',
      }}
    >
      {/* Header: Icon + Title + Confidence Indicator */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '11px',
              backgroundColor: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AnalysisIcon size={22} aria-hidden style={{ color: accent }} />
          </div>
          <h2
            style={{
              color: 'var(--text-primary)',
              fontSize: '1.0625rem',
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {ANALYSIS_TITLE[analysisType]}
          </h2>
        </div>
        <ConfidenceIndicator level={(result as AnyResult).confidence} />
      </div>

      {/* Type-Specific Content */}
      {renderContent()}

      {/* Disclaimer — ALWAYS visible, per regulatory requirement */}
      <div
        style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <p
          style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.7rem',
            lineHeight: '1.6',
          }}
        >
          {(result as AnyResult).disclaimer}
        </p>
      </div>

      {/* Save to Log feedback banner */}
      {saveState === 'saved' && (
        <div
          className="flex items-center gap-2 mt-3 rounded-md"
          style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(10,110,92,0.08)',
            border: '1px solid rgba(10,110,92,0.2)',
          }}
        >
          <CheckCircle size={15} aria-hidden style={{ color: '#0A6E5C', flexShrink: 0 }} />
          <p className="text-xs font-medium" style={{ color: '#0A6E5C' }}>
            Saved to patient log
          </p>
        </div>
      )}
      {saveState === 'error' && (
        <div
          className="flex items-center gap-2 mt-3 rounded-md"
          style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <XCircle size={15} aria-hidden style={{ color: '#EF4444', flexShrink: 0 }} />
          <p className="text-xs font-medium" style={{ color: '#B91C1C' }}>
            Failed to save. Tap &quot;Save to Log&quot; to retry.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {/* Save to Log — always present, disabled after success */}
        <button
          onClick={() => void handleSaveToLog()}
          type="button"
          className="btn-secondary"
          disabled={saveState === 'saved' || saveState === 'saving'}
          aria-label="Save this result to the patient log"
          style={{
            height: '38px',
            fontSize: '0.8125rem',
            opacity: saveState === 'saved' ? 0.6 : 1,
            cursor: saveState === 'saved' ? 'not-allowed' : 'pointer',
          }}
        >
          {saveState === 'saving' ? (
            <RefreshCw size={15} aria-hidden className="animate-spin" />
          ) : saveState === 'saved' ? (
            <CheckCircle size={15} aria-hidden />
          ) : (
            <BookmarkPlus size={15} aria-hidden />
          )}
          {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Save to Log'}
        </button>

        {onAskFollowUp && (
          <button
            onClick={onAskFollowUp}
            type="button"
            className="btn-secondary"
            style={{ height: '38px', fontSize: '0.8125rem', backgroundColor: 'var(--bg-subtle)' }}
          >
            <FileText size={15} aria-hidden />
            Ask Follow-up
          </button>
        )}
        {onExport && (
          <button onClick={onExport} type="button" className="btn-secondary" style={{ height: '38px', fontSize: '0.8125rem' }}>
            <Share2 size={15} aria-hidden />
            Export
          </button>
        )}
        {onNewAnalysis && (
          <button onClick={onNewAnalysis} type="button" className="btn-secondary" style={{ height: '38px', fontSize: '0.8125rem' }}>
            <RefreshCw size={15} aria-hidden />
            New Analysis
          </button>
        )}
      </div>
    </div>
  );
}

export default ResultCard;
