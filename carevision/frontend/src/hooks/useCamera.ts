/**
 * CareVision — Camera Permission Hook
 * Spec Reference: Section 3.2.5 (CameraCapture Component)
 *
 * WHY separate hook: Camera permission is stateful and cross-cutting.
 * Separating it from CameraCapture.tsx allows reuse and independent testing.
 */

import { useState, useCallback } from 'react';

export type CameraPermissionState = 'unknown' | 'granted' | 'denied' | 'unavailable';

interface UseCameraReturn {
  permissionState: CameraPermissionState;
  requestPermission: () => Promise<boolean>;
  isSupported: boolean;
}

export function useCamera(): UseCameraReturn {
  // WHY check isSupported: getUserMedia is unavailable over plain HTTP (except localhost)
  const isSupported =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  const [permissionState, setPermissionState] =
    useState<CameraPermissionState>(isSupported ? 'unknown' : 'unavailable');

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setPermissionState('unavailable');
      return false;
    }

    try {
      // Request camera stream — triggers browser permission dialog
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Rear camera for field use
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      // Immediately stop the stream — CameraCapture will open its own
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
      return true;
    } catch (err) {
      const error = err as DOMException;
      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError'
      ) {
        setPermissionState('denied');
      } else {
        // Device not available, overconstrained, etc.
        setPermissionState('unavailable');
      }
      return false;
    }
  }, [isSupported]);

  return { permissionState, requestPermission, isSupported };
}
