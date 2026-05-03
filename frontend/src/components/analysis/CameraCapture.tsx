/**
 * CareVision — CameraCapture (Analysis Component)
 * Spec Reference: Section 3.2.5
 *
 * Features:
 * 1. Live camera feed (rear-facing, environment mode)
 * 2. Framing guide overlay (dashed rectangle, 60% of viewport)
 * 3. Gallery upload button (accepts JPEG, PNG, WebP)
 * 4. Image quality validation (max 1MB, auto-compress)
 * 5. Camera permission denied fallback (gallery only)
 *
 * WHY react-webcam: Handles cross-browser getUserMedia, screenshot extraction,
 * and provides proper stream cleanup on unmount.
 */

import React, { useRef, useState, useCallback, type ChangeEvent } from 'react';
import Webcam from 'react-webcam';
import imageCompression from 'browser-image-compression';
import { Camera, Upload } from 'lucide-react';
import {
  IMAGE_MAX_SIZE_BYTES,
  IMAGE_QUALITY,
  IMAGE_MAX_WIDTH,
  IMAGE_MAX_HEIGHT,
} from '@/constants/api';

interface CameraCaptureProps {
  /** Called with base64 JPEG string when image is captured/uploaded */
  onCapture: (base64Image: string) => void;
}

// Accepted MIME types per spec Section 3.2.5
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_TYPES_ATTR = 'image/jpeg,image/png,image/webp';

async function compressAndEncode(file: File | Blob): Promise<string> {
  const compressed = await imageCompression(file instanceof File ? file : new File([file], 'capture.jpg', { type: 'image/jpeg' }), {
    maxSizeMB: IMAGE_MAX_SIZE_BYTES / (1024 * 1024),
    maxWidthOrHeight: Math.max(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT),
    useWebWorker: true,
    initialQuality: IMAGE_QUALITY,
    fileType: 'image/jpeg',
  });

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(compressed);
  });
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [hasPermission, setHasPermission] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Camera capture
  // ---------------------------------------------------------------------------
  const handleCapture = useCallback(async () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) {
      setError('Failed to capture image. Please try again.');
      return;
    }

    try {
      // Convert data URL to Blob for compression
      const res = await fetch(screenshot);
      const blob = await res.blob();
      const compressed = await compressAndEncode(blob);
      onCapture(compressed);
    } catch {
      setError('Failed to process image. Please try again.');
    }
  }, [onCapture]);

  // ---------------------------------------------------------------------------
  // Gallery upload
  // ---------------------------------------------------------------------------
  const handleFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Format validation — check MIME type (not just extension)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    setError(null);

    try {
      const encoded = await compressAndEncode(file);
      onCapture(encoded);
    } catch {
      setError('Failed to process the uploaded image. Please try another file.');
    }

    // Reset input so same file can be re-uploaded if needed
    e.target.value = '';
  }, [onCapture]);

  return (
    <div className="animate-fade-in">
      {/* Camera Viewport */}
      <div
        className="relative overflow-hidden rounded-lg bg-black mb-4"
        style={{ aspectRatio: '16/9' }}
      >
        {hasPermission ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.9}
            videoConstraints={{
              facingMode: 'environment',  // Rear camera for field analysis
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }}
            className="w-full h-full object-cover"
            onUserMediaError={() => setHasPermission(false)}
          />
        ) : (
          /* Permission denied fallback */
          <div
            className="flex flex-col items-center justify-center h-full text-white gap-2 p-4"
          >
            <Camera size={48} className="opacity-50" aria-hidden />
            <p className="text-sm text-center opacity-75">
              Camera access denied. Use the gallery upload button below.
            </p>
          </div>
        )}

        {/* Framing Guide Overlay — dashed rectangle 60% of viewport (Spec 3.2.5) */}
        {hasPermission && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden
          >
            <div
              style={{
                width: '60%',
                height: '60%',
                border: '2px dashed rgba(255, 255, 255, 0.7)',
                borderRadius: '4px',
              }}
            />
          </div>
        )}

        {/* Framing hint text */}
        {hasPermission && (
          <p
            className="absolute bottom-2 left-0 right-0 text-center text-xs text-white opacity-70 pointer-events-none"
            aria-hidden
          >
            Align the subject within the guide
          </p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="text-sm mb-3 rounded-md p-3"
          style={{
            color: '#B91C1C',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 items-center">
        {/* Gallery Upload */}
        <label
          className="btn-secondary flex-1 justify-center"
          htmlFor="gallery-upload"
          aria-label="Upload from gallery"
        >
          <Upload size={20} aria-hidden />
          Gallery
          <input
            id="gallery-upload"
            type="file"
            accept={ACCEPTED_TYPES_ATTR}
            className="sr-only"
            onChange={handleFileUpload}
          />
        </label>

        {/* Capture Button — large circular per spec */}
        {hasPermission && (
          <button
            onClick={() => void handleCapture()}
            type="button"
            aria-label="Capture photo"
            className="flex items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{
              width: '72px',
              height: '72px',
              flexShrink: 0,
            }}
          >
            <Camera size={32} aria-hidden style={{ color: '#1A2332' }} />
          </button>
        )}
      </div>
    </div>
  );
}

export default CameraCapture;
