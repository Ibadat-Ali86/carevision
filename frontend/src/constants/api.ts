/**
 * CareVision — API Configuration Constants
 * Spec Reference: Section 8.5 (API Client Setup)
 *
 * PRODUCTION REQUIREMENT:
 *   Set VITE_API_BASE_URL in your Vercel project dashboard under:
 *   Project → Settings → Environment Variables
 *   Value: https://<your-railway-app>.up.railway.app
 *
 *   Vite bakes this value at BUILD TIME. Adding it after deployment
 *   requires a full Vercel redeploy to take effect.
 */

// Resolve the backend base URL.
// In production (Vercel), VITE_API_BASE_URL MUST be set or all API calls fail.
// In development, falls back to 127.0.0.1:8000.
const _rawApiUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

if (!_rawApiUrl && import.meta.env.PROD) {
  // This runs at runtime in the browser. If we reach here in production,
  // it means the env var was not set when Vercel built the frontend.
  // Log a clear error so it appears in browser DevTools.
  console.error(
    '[CareVision] FATAL: VITE_API_BASE_URL is not set.\n' +
    'Go to Vercel → Project Settings → Environment Variables and add:\n' +
    '  VITE_API_BASE_URL = https://<your-railway-app>.up.railway.app\n' +
    'Then trigger a manual redeploy from the Vercel dashboard.'
  );
}

export const API_BASE_URL: string = (_rawApiUrl || 'http://127.0.0.1:8000').replace(/\/+$/, '');

// WHY 60s: Gemma AI analysis has 15–25s latency on first request (cold start).
// 30s was too aggressive — caused spurious TIMEOUT_ERRORs before the model responded.
// 60s gives a full safety margin while still catching genuine network failures.
export const API_TIMEOUT_MS = 60_000;

// WHY 2 retries: Balances reliability with latency.
// After 3 total attempts with exponential backoff, failures are queued offline.
export const API_MAX_RETRIES = 2;

// Offline queue configuration (Spec Section 5.2 and Section 8 reference index)
export const OFFLINE_QUEUE_MAX_RETRIES = 3;

// Image compression limits (Spec Section 8 reference index)
export const IMAGE_MAX_SIZE_MB = 1;
export const IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024;
export const IMAGE_QUALITY = 0.8;
export const IMAGE_MAX_WIDTH = 1920;
export const IMAGE_MAX_HEIGHT = 1080;

// PWA / cache settings
export const OFFLINE_CACHE_TTL_DAYS = 30;
