/**
 * CareVision — ClinicalLoadingState (Shared Component)
 * Phase 2 of UX improvements per carevision-ux-improvements.md
 *
 * Replaces the generic LoadingState with a context-aware clinical variant.
 *
 * WHY cycling messages: "Black screen then result" is anxiety-inducing in
 * clinical contexts. CHWs need reassurance the AI is actively processing.
 * Messages are clinically grounded, not generic "please wait" text.
 *
 * WHY capped progress at 90%: Never show 100% until result arrives.
 * Fake completion before the real event damages trust.
 *
 * WHY framer-motion for message transitions: The library is already installed
 * (v11.0.24). Fade transitions prevent jarring text jumps without heavyweight
 * animations that could distract during patient encounters.
 *
 * Reduced motion: All animations respect prefers-reduced-motion via the
 * global CSS rule in index.css.
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, WifiOff, Clock, Wifi } from 'lucide-react';
import type { AnalysisType } from '@/types/analysis';

// AnalysisType is 'teststrip' | 'medscan' | 'woundassess' | 'docreader'
// Protocol is added for the ProtocolAssistant page
type LoadingAnalysisType = AnalysisType | 'protocol';

interface ClinicalLoadingStateProps {
  /** Analysis type drives the contextual message cycle */
  analysisType?: LoadingAnalysisType;
  /** Fallback message for non-typed callers — kept for backward compatibility */
  message?: string;
  /** Show offline-queued state instead of active processing */
  isOfflineQueued?: boolean;
}

// Contextual loading messages per analysis type — clinical language only
const LOADING_MESSAGES: Record<LoadingAnalysisType, string[]> = {
  teststrip: [
    'Analyzing test strip lines...',
    'Validating control line visibility...',
    'Comparing test line intensity...',
    'Generating clinical recommendation...',
  ],
  medscan: [
    'Extracting medication information...',
    'Identifying drug names and dosages...',
    'Cross-checking contraindications...',
    'Preparing safety guidelines...',
  ],
  woundassess: [
    'Assessing wound characteristics...',
    'Analyzing tissue appearance...',
    'Calculating severity score...',
    'Determining referral urgency...',
  ],
  docreader: [
    'Reading document content...',
    'Extracting clinical data...',
    'Structuring lab results...',
    'Formatting for review...',
  ],
  protocol: [
    'Searching clinical protocols...',
    'Consulting WHO guidelines...',
    'Retrieving best practices...',
    'Preparing guidance...',
  ],
};

export function ClinicalLoadingState({
  analysisType,
  message,
  isOfflineQueued = false,
}: ClinicalLoadingStateProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const messages = analysisType
    ? LOADING_MESSAGES[analysisType]
    : [message ?? 'Analyzing clinical data...'];

  // Cycle messages every 2.5s while processing
  useEffect(() => {
    if (isOfflineQueued || messages.length <= 1) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isOfflineQueued, messages.length]);

  // Non-deterministic progress bar — slows near 90%, never reaches 100%
  useEffect(() => {
    if (isOfflineQueued) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 60) return Math.min(prev + Math.random() * 14, 60);
        if (prev < 80) return Math.min(prev + Math.random() * 4, 80);
        return Math.min(prev + Math.random() * 1.5, 90);
      });
    }, 800);
    return () => clearInterval(interval);
  }, [isOfflineQueued]);

  // ── Offline queued state ───────────────────────────────────────────────────
  if (isOfflineQueued) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Analysis queued — offline"
        style={{ padding: '2rem 1rem', textAlign: 'center' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <WifiOff size={48} style={{ color: '#D97706' }} aria-hidden />
            <Clock
              size={20}
              style={{
                color: '#B45309',
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                backgroundColor: 'white',
                borderRadius: '50%',
              }}
              aria-hidden
            />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Analysis Queued
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: '1.6' }}>
              You're currently offline. This analysis will process automatically
              when connection is restored.
            </p>
          </div>
          <div
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(217, 119, 6, 0.08)',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              borderRadius: '0.5rem',
            }}
          >
            <p style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>
              Your patient data is safe and encrypted locally
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Active processing state ────────────────────────────────────────────────
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={messages[messageIndex]}
      style={{ animation: 'fadeIn 200ms ease-in-out' }}
    >
      {/* Processing header pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '1.25rem',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(10, 110, 92, 0.08)',
            border: '1px solid rgba(10, 110, 92, 0.2)',
          }}
        >
          {/* Spinning loader */}
          <Loader2
            size={14}
            aria-hidden
            style={{
              color: '#0A6E5C',
              animation: 'spin 1s linear infinite',
            }}
          />

          {/* Cycling contextual message */}
          <AnimatePresence mode="wait">
            <motion.span
              key={messageIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#0A6E5C',
              }}
            >
              {messages[messageIndex]}
            </motion.span>
          </AnimatePresence>

          {/* Online indicator */}
          <Wifi size={12} style={{ color: '#10B981' }} aria-label="Online" />
        </div>
      </div>

      {/* Skeleton card — preserves result card layout during loading */}
      <div
        style={{
          border: '1px solid var(--border-default)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          backgroundColor: 'var(--bg-elevated)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Animated progress bar at top */}
        <motion.div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '3px',
            backgroundColor: '#0A6E5C',
            borderRadius: '0 0 2px 0',
            opacity: 0.85,
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Header row skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
            <div className="skeleton" style={{ width: '140px', height: '20px' }} />
          </div>
          <div className="skeleton" style={{ width: '90px', height: '16px', borderRadius: '9999px' }} />
        </div>

        {/* Badge skeleton */}
        <div className="skeleton" style={{ width: '130px', height: '36px', borderRadius: '9999px', marginBottom: '1rem' }} />

        {/* Body skeletons */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="skeleton" style={{ width: '100px', height: '12px', marginBottom: '0.625rem' }} />
          <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ width: '90%', height: '14px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ width: '75%', height: '14px' }} />
        </div>

        {/* Section heading skeleton */}
        <div className="skeleton" style={{ width: '120px', height: '12px', marginBottom: '0.75rem' }} />

        {/* List skeletons */}
        <div style={{ marginBottom: '1.25rem' }}>
          {[100, 95, 88, 80].map((w, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: `${w}%`, height: '12px', marginBottom: '0.5rem' }}
            />
          ))}
        </div>

        {/* Disclaimer skeleton */}
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-subtle)',
          }}
        >
          <div className="skeleton" style={{ width: '100%', height: '10px', marginBottom: '0.375rem' }} />
          <div className="skeleton" style={{ width: '80%', height: '10px' }} />
        </div>

        {/* Reassurance message */}
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            textAlign: 'center',
            marginTop: '1rem',
          }}
        >
          This typically takes 5–15 seconds
        </p>
      </div>

      {/* SR live region */}
      <div className="sr-only" aria-live="assertive">
        {messages[messageIndex]} Please wait.
      </div>
    </div>
  );
}

/**
 * Backward-compatible alias.
 * Existing callers using `<LoadingState message="..." />` continue to work.
 */
export function LoadingState({ message = 'Analyzing...' }: { message?: string }) {
  return <ClinicalLoadingState message={message} />;
}

export default ClinicalLoadingState;
