/**
 * CareVision — DisclaimerBanner (Shared Component)
 * Spec Reference: Section 3.2.3
 *
 * Mandatory medical disclaimer displayed on every analysis page.
 * NEVER omit or make dismissible — regulatory compliance requirement.
 *
 * WHY wrapper: Delegates to MedicalDisclaimer for consistent clinical
 * styling while keeping all existing import paths unchanged.
 *
 * role="alert" + aria-live="polite" ensured by MedicalDisclaimer internally.
 */

import React from 'react';
import { MedicalDisclaimer } from '@/components/disclaimer/MedicalDisclaimer';

export function DisclaimerBanner() {
  return (
    <MedicalDisclaimer
      context="analysis"
      variant="default"
      className="mb-5"
    />
  );
}

export default DisclaimerBanner;
