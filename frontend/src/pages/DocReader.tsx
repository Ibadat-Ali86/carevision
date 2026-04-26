/**
 * CareVision — DocReader Page
 */

import React from 'react';
import { AnalysisPage } from '@/components/features/AnalysisPage';
import { analyzeDocReader } from '@/api/endpoints';
import type { DocReaderResult, AnalysisRequest } from '@/types/analysis';

export default function DocReader() {
  const handleAnalyze = async (
    imageBase64: string,
    language: string,
    consent: boolean
  ): Promise<DocReaderResult> => {
    const req: AnalysisRequest = { image_b64: imageBase64, type: 'docreader', language, consent_given: consent };
    const res = await analyzeDocReader(req);
    if (!res.result) {
      throw new Error('Analysis returned no result');
    }
    return res.result;
  };

  return (
    <AnalysisPage
      analysisType="docreader"
      pageTitle="DocReader"
      onAnalyze={handleAnalyze}
    />
  );
}
