/**
 * CareVision — Axios API Client
 * Spec Reference: Section 8.5
 *
 * Single Axios instance with:
 * - 30s timeout for Gemma AI analysis calls
 * - Request/response logging (dev only)
 * - Network and HTTP error handling
 * - No silent failure swallowing
 */

import axios, { type AxiosError, type AxiosResponse } from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '@/constants/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request Interceptor
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    // Dev logging only — never log in production (would expose base64 images)
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error: AxiosError) => {
    // Request configuration errors (e.g. invalid URL) — not network errors
    console.error('[API Request Error]', error.message);
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Response Interceptor
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    // Network error — device is offline or server unreachable
    if (error.code === 'ERR_NETWORK') {
      // Do NOT suppress — throw so TanStack Query can handle retry/offline queue
      return Promise.reject(new Error('NETWORK_ERROR'));
    }

    // Request timeout
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('TIMEOUT_ERROR'));
    }

    // HTTP error responses
    if (error.response) {
      const status = error.response.status;
      const detail = (error.response.data as Record<string, string>)?.detail
        || error.message;

      // 422 Unprocessable Entity — request schema validation failed
      if (status === 422) {
        return Promise.reject(new Error(`VALIDATION_ERROR: ${detail}`));
      }

      // 500 Internal Server Error — backend failure
      if (status >= 500) {
        return Promise.reject(new Error(`SERVER_ERROR: ${detail}`));
      }

      return Promise.reject(new Error(`HTTP_${status}: ${detail}`));
    }

    return Promise.reject(error);
  }
);
