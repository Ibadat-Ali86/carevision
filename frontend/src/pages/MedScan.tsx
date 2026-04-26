/**
 * CareVision — MedScan Page
 * Spec Reference: Section 4.2 (MedScan Analysis Feature)
 */

import React from 'react';
import { AnalysisPage } from '@/components/features/AnalysisPage';
import { analyzeMedScan } from '@/api/endpoints';
import type { MedScanResult, AnalysisRequest } from '@/types/analysis';

export default function MedScan() {
  const handleAnalyze = async (
    imageBase64: string,
    language: string,
    consent: boolean
  ): Promise<MedScanResult> => {
    const req: AnalysisRequest = { image_b64: imageBase64, type: 'medscan', language, consent_given: consent };
    const res = await analyzeMedScan(req);
    if (!res.result) {
      throw new Error('Analysis returned no result');
    }
    return res.result;
  };

  return (
    <AnalysisPage
      analysisType="medscan"
      pageTitle="MedScan"
      onAnalyze={handleAnalyze}
    />
  );
}
