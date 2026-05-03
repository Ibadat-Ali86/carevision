/**
 * CareVision — WoundAssess Page
 * Spec Reference: Section 4.3 (WoundAssess Feature)
 *
 * Differences from other analysis pages:
 * 1. Pre-capture warning panel before camera (consent gate)
 * 2. Severity 4-5: "Generate Referral Card" action in result
 * 3. Severity 5: Emergency pulsing border + Call button in ResultCard
 *
 * These are implemented via the AnalysisPage props:
 * - preCapture: rendered when state is idle/ready
 * - onGenerateReferral: triggered from ResultCard on severity 4-5
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { AnalysisPage } from '@/components/features/AnalysisPage';
import { analyzeWoundAssess } from '@/api/endpoints';
import type { WoundAssessResult, AnalysisRequest } from '@/types/analysis';

function WoundAssessPreCapture() {
  return (
    <div
      role="note"
      className="mb-4 flex items-start gap-3 rounded-md"
      style={{
        padding: 'var(--space-4)',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <AlertTriangle
        size={20}
        className="flex-shrink-0 mt-0.5"
        aria-hidden
        style={{ color: '#B45309' }}
      />
      <div>
        <p className="text-sm font-semibold" style={{ color: '#B45309' }}>
          Important Before Capturing
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Ensure the wound area is clearly visible in good lighting.
          This tool provides guidance only — always follow local health protocols
          and refer severe cases to the nearest health facility.
        </p>
      </div>
    </div>
  );
}

export default function WoundAssess() {
  const navigate = useNavigate();

  const handleAnalyze = async (
    imageBase64: string,
    language: string,
    consent: boolean
  ): Promise<WoundAssessResult> => {
    const req: AnalysisRequest = {
      image_b64: imageBase64,
      type: 'woundassess',
      language,
      consent_given: consent,
    };
    const res = await analyzeWoundAssess(req);
    if (!res.result) {
      throw new Error('Analysis returned no result');
    }
    return res.result;
  };

  const handleGenerateReferral = (result: WoundAssessResult) => {
    // Map WoundAssess output → backend ReferralRequest contract:
    //   severity           → urgency         (same numeric scale 1–5)
    //   wound_type         → patient_summary (descriptive prefix for CHW context)
    //   severity_rationale → clinical_reason
    //   recommended_action → facility_type_needed
    navigate('/referral', {
      state: {
        // These keys mirror ReferralCard.tsx ReferralState interface
        urgency: result.severity,
        patientSummary: `Wound: ${result.wound_type}`,
        clinicalReason: result.severity_rationale,
        facilityTypeNeeded: result.recommended_action,
      },
    });
  };

  return (
    <AnalysisPage<WoundAssessResult>
      analysisType="woundassess"
      pageTitle="WoundAssess"
      onAnalyze={handleAnalyze}
      onGenerateReferral={handleGenerateReferral}
      preCapture={<WoundAssessPreCapture />}
    />
  );
}
