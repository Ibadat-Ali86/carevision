/**
 * CareVision — API Configuration Constants
 * Spec Reference: Section 8.5 (API Client Setup)
 */

// Base URL from Vite environment variable — set in .env as VITE_API_BASE_URL
// Falls back to localhost:8000 for local development
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000';

// WHY 30s: Gemma AI analysis can take 15–25s on free-tier infrastructure.
// 35s was spec'd in the original API client — 30s provides safety margin.
export const API_TIMEOUT_MS = 30_000;

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
