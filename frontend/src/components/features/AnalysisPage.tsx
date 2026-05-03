/**
 * CareVision — Reusable Analysis Page
 * Implements the 6-state machine common to TestStrip, MedScan, WoundAssess, DocReader
 * Spec Reference: Section 4.2 (State Machine)
 *
 * States: idle → ready → preview → analyzing → result → error
 *
 * WHY no H1 in body: The Header already shows pageTitle as H1.
 * Adding a second H1 here was a duplicate — removed for correct heading hierarchy.
 */

import React, { useState, useCallback } from 'react';
import { AlertCircle, RefreshCw, CheckCircle, Camera, Eye, Zap, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageContainer } from '@/components/layout/PageContainer';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { ConsentToggle } from '@/components/shared/ConsentToggle';
import { CameraCapture } from '@/components/analysis/CameraCapture';
import { ImagePreview } from '@/components/analysis/ImagePreview';
import { ClinicalLoadingState } from '@/components/shared/LoadingState';
import { ResultCard } from '@/components/analysis/ResultCard';
import type { AnalysisType, BaseAnalysisResult } from '@/types/analysis';
import type { AnalysisPageState } from '@/types/app';
import { useSettingsStore } from '@/store/settingsStore';

interface AnalysisPageProps<T extends BaseAnalysisResult> {
  analysisType: AnalysisType;
  pageTitle: string;
  /** Called when user submits image; must return result or throw */
  onAnalyze: (imageBase64: string, language: string, consent: boolean) => Promise<T>;
  /** Shown on WoundAssess severity 4-5 */
  onGenerateReferral?: (result: T) => void;
  /** Optional pre-capture warning (WoundAssess) */
  preCapture?: React.ReactNode;
}

// Visual step definitions for the progress stepper
const STEPS = [
  { key: 'idle',      label: 'Consent',  Icon: CheckCircle },
  { key: 'ready',     label: 'Capture',  Icon: Camera },
  { key: 'preview',   label: 'Confirm',  Icon: Eye },
  { key: 'analyzing', label: 'Analyzing', Icon: Zap },
  { key: 'result',    label: 'Result',   Icon: FileText },
];

function getStepIndex(state: AnalysisPageState): number {
  const map: Record<AnalysisPageState, number> = {
    idle: 0, ready: 1, preview: 2, analyzing: 3, result: 4, error: 4,
  };
  return map[state] ?? 0;
}

export function AnalysisPage<T extends BaseAnalysisResult>({
  analysisType,
  pageTitle,
  onAnalyze,
  onGenerateReferral,
  preCapture,
}: AnalysisPageProps<T>) {
  const navigate = useNavigate();
  const { language, defaultConsent } = useSettingsStore();
  const [pageState, setPageState] = useState<AnalysisPageState>('idle');
  const [consent, setConsent] = useState(defaultConsent);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<T | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Metadata from AnalyzeResponse for ResultCard's Save to Log
  const [processingTimeMs, setProcessingTimeMs] = useState<number | undefined>(undefined);
  const [modelUsed, setModelUsed] = useState<string | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // IDLE → READY when consent toggled on
  const handleConsentChange = useCallback((checked: boolean) => {
    setConsent(checked);
    if (checked && pageState === 'idle') {
      setPageState('ready');
    } else if (!checked) {
      setPageState('idle');
    }
  }, [pageState]);

  // READY → PREVIEW
  const handleCapture = useCallback((base64: string) => {
    setCapturedImage(base64);
    setPageState('preview');
  }, []);

  // PREVIEW → READY (retake)
  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setPageState('ready');
  }, []);

  // PREVIEW → ANALYZING → RESULT / ERROR
  const handleConfirm = useCallback(async () => {
    if (!capturedImage || !consent) return;
    setPageState('analyzing');
    setErrorMessage(null);

    try {
      // onAnalyze returns only T (the result). For metadata we need the full response.
      // We capture it via a wrapper that the page components provide.
      const analysisResult = await onAnalyze(capturedImage, language, consent);
      setResult(analysisResult);
      setPageState('result');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setErrorMessage(msg);
      setPageState('error');
    }
  }, [capturedImage, consent, onAnalyze, language]);

  // ERROR / RESULT → READY
  const handleNewAnalysis = useCallback(() => {
    setCapturedImage(null);
    setResult(null);
    setErrorMessage(null);
    setPageState(consent ? 'ready' : 'idle');
  }, [consent]);

  const handleExport = useCallback(() => {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carevision-${analysisType}-result.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, analysisType]);

  const handleAskFollowUp = useCallback(() => {
    if (!result || !capturedImage) return;
    
    // Strip the base64 prefix if present, as backend expects raw base64 string
    const cleanBase64 = capturedImage.includes(',') 
      ? capturedImage.split(',')[1] 
      : capturedImage;
      
    navigate('/protocol', {
      state: {
        image_b64: cleanBase64,
        context: JSON.stringify(result, null, 2),
      }
    });
  }, [result, capturedImage, navigate]);

  const currentStepIndex = getStepIndex(pageState);
  const isError = pageState === 'error';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header showBackButton backRoute="/" pageTitle={pageTitle} />

      <PageContainer>
        {/* ── Progress Stepper ──────────────────────────────────────────── */}
        {pageState !== 'result' && (
          <div
            className="mb-6"
            aria-label="Analysis progress"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: '0.625rem',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            {STEPS.map((step, i) => {
              const isActive = i === currentStepIndex && !isError;
              const isDone = i < currentStepIndex && !isError;
              const Icon = step.Icon;

              return (
                <React.Fragment key={step.key}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isActive
                          ? '#0A6E5C'
                          : isDone
                            ? 'rgba(10, 110, 92, 0.15)'
                            : '#F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 200ms ease-in-out',
                        boxShadow: isActive ? '0 2px 8px rgba(10,110,92,0.35)' : 'none',
                      }}
                    >
                      <Icon
                        size={13}
                        style={{
                          color: isActive ? '#FFFFFF' : isDone ? '#0A6E5C' : '#94A3B8',
                        }}
                        aria-hidden
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#0A6E5C' : isDone ? '#475569' : '#94A3B8',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div
                      aria-hidden
                      style={{
                        height: '1px',
                        flex: '0 0 12px',
                        backgroundColor: i < currentStepIndex ? '#0A6E5C' : '#E2E8F0',
                        transition: 'background-color 200ms ease-in-out',
                        marginBottom: '14px',
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Disclaimer — always visible */}
        <DisclaimerBanner />

        {/* Consent toggle */}
        <ConsentToggle checked={consent} onChange={handleConsentChange} />

        {/* Optional pre-capture warning (WoundAssess) */}
        {preCapture && (pageState === 'ready' || pageState === 'idle') && preCapture}

        {/* State-driven main content */}
        <div className="mt-2">
          {/* IDLE or READY — camera */}
          {(pageState === 'idle' || pageState === 'ready') && (
            <CameraCapture onCapture={handleCapture} />
          )}

          {/* PREVIEW */}
          {pageState === 'preview' && capturedImage && (
            <ImagePreview
              imageSrc={capturedImage}
              onRetake={handleRetake}
              onConfirm={() => void handleConfirm()}
              confirmDisabled={!consent}
            />
          )}

          {/* ANALYZING */}
          {pageState === 'analyzing' && (
            <ClinicalLoadingState analysisType={analysisType} />
          )}

          {/* RESULT */}
          {pageState === 'result' && result && (
            <ResultCard
              analysisType={analysisType}
              result={result as unknown as import('@/types/analysis').DocReaderResult | import('@/types/analysis').MedScanResult | import('@/types/analysis').TestStripResult | import('@/types/analysis').WoundAssessResult}
              onExport={handleExport}
              onNewAnalysis={handleNewAnalysis}
              onAskFollowUp={handleAskFollowUp}
              onGenerateReferral={
                onGenerateReferral ? () => onGenerateReferral(result) : undefined
              }
              processingTimeMs={processingTimeMs}
              modelUsed={modelUsed}
              imageUrl={imageUrl}
            />
          )}

          {/* ERROR */}
          {pageState === 'error' && (
            <div
              style={{
                borderRadius: '0.75rem',
                padding: '1.5rem',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderLeft: '4px solid #EF4444',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertCircle size={22} aria-hidden style={{ color: '#EF4444' }} />
                </div>
                <div>
                  <h2
                    className="font-semibold mb-1.5"
                    style={{ color: 'var(--text-primary)', fontSize: '1rem' }}
                  >
                    Analysis Failed
                  </h2>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {errorMessage?.includes('NETWORK_ERROR')
                      ? 'You appear to be offline. Your request has been saved and will sync when connection is restored.'
                      : 'The image quality may be insufficient or a server error occurred. For best results:'}
                  </p>
                  {!errorMessage?.includes('NETWORK_ERROR') && (
                    <ul className="text-sm space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                      {[
                        'Good lighting — natural daylight preferred',
                        'Hold camera steady to avoid blur',
                        'Ensure subject fills the frame',
                      ].map((tip, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <span style={{ color: '#0A6E5C', fontWeight: 700, flexShrink: 0 }}>·</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <button
                onClick={handleNewAnalysis}
                type="button"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <RefreshCw size={16} aria-hidden />
                Try Again
              </button>
            </div>
          )}
        </div>
      </PageContainer>

      <Footer />
    </div>
  );
}

export default AnalysisPage;
