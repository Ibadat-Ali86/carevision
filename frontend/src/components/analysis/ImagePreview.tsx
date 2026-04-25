/**
 * CareVision — ImagePreview (Analysis Component)
 * Spec Reference: Section 3.2.5 (captured image state)
 *
 * Shown after image capture/upload, before submission for analysis.
 * Provides "Retake" and "Analyze" actions.
 */

import React from 'react';
import { RotateCw, Zap } from 'lucide-react';

interface ImagePreviewProps {
  imageSrc: string;
  onRetake: () => void;
  onConfirm: () => void;
  /** Disable confirm button when consent not given */
  confirmDisabled?: boolean;
}

export function ImagePreview({
  imageSrc,
  onRetake,
  onConfirm,
  confirmDisabled = false,
}: ImagePreviewProps) {
  return (
    <div className="animate-fade-in">
      <div className="relative rounded-lg overflow-hidden mb-4" style={{ maxHeight: '400px' }}>
        <img
          src={imageSrc}
          alt="Captured image for analysis"
          className="w-full object-contain"
          style={{ maxHeight: '400px', backgroundColor: '#000' }}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRetake}
          className="btn-secondary flex-1"
          type="button"
        >
          <RotateCw size={18} aria-hidden />
          Retake
        </button>
        <button
          onClick={onConfirm}
          className="btn-primary flex-1"
          type="button"
          disabled={confirmDisabled}
          aria-disabled={confirmDisabled}
        >
          <Zap size={18} aria-hidden />
          Analyze
        </button>
      </div>

      {confirmDisabled && (
        <p
          className="text-xs text-center mt-2"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Please give consent above to proceed with analysis.
        </p>
      )}
    </div>
  );
}

export default ImagePreview;
