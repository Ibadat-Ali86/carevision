/**
 * CareVision — TestStrip Reader Page
 * Spec Reference: Section 4.2 (TestStrip Analysis Feature)
 *
 * Thin wrapper around AnalysisPage<TestStripResult>.
 * Provides the type-specific analysis function.
 */

import React from 'react';
import { AnalysisPage } from '@/components/features/AnalysisPage';
import { analyzeTestStrip } from '@/api/endpoints';
import type { TestStripResult, AnalysisRequest } from '@/types/analysis';

export default function TestStrip() {
  const handleAnalyze = async (
    imageBase64: string,
    language: string,
    consent: boolean
  ): Promise<TestStripResult> => {
    const req: AnalysisRequest = { image_b64: imageBase64, type: 'teststrip', language, consent_given: consent };
    const res = await analyzeTestStrip(req);
    if (!res.success || !res.result) {
      throw new Error(res.error || 'Analysis returned no result');
    }
    return res.result;
  };

  return (
    <AnalysisPage
      analysisType="teststrip"
      pageTitle="TestStrip Reader"
      onAnalyze={handleAnalyze}
    />
  );
}
