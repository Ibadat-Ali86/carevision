/**
 * CareVision — Validators Utility
 * Spec Reference: Section 8.3 (Client-Side Validation)
 *
 * Client-side guards applied BEFORE sending to the backend.
 * These supplement backend validation — they do not replace it.
 */

/** Maximum image size accepted by the backend (1MB compressed). */
const MAX_IMAGE_BYTES = 1_048_576; // 1MB

/**
 * Estimates the decoded byte size of a base64 string.
 *
 * Formula: base64 length * 0.75 (approximate, ignores padding chars).
 * Intentionally fast (O(1)) — avoids decoding the full buffer.
 *
 * Time: O(1) | Space: O(1)
 */
function estimateBase64Bytes(b64: string): number {
  // Strip data URI prefix if present
  const raw = b64.includes(',') ? b64.split(',')[1] : b64;
  return Math.floor(raw.length * 0.75);
}

/**
 * Returns true if the image base64 is within the allowed size limit.
 *
 * @param base64  - Raw or data-URI base64 string
 * @param maxBytes - Maximum allowed bytes (default: 1MB)
 */
export function validateImageSize(
  base64: string,
  maxBytes: number = MAX_IMAGE_BYTES
): boolean {
  return estimateBase64Bytes(base64) <= maxBytes;
}

/**
 * Returns human-readable estimated size of the base64 image.
 * Used for error messages in the upload UI.
 */
export function estimateImageSizeKB(base64: string): number {
  return Math.round(estimateBase64Bytes(base64) / 1024);
}

/**
 * Returns true if the string appears to be a valid base64 image.
 * Checks for data URI prefix or raw base64 character set.
 */
export function isValidBase64Image(value: string): boolean {
  if (!value) return false;

  // Accept data URI format
  if (value.startsWith('data:image/')) {
    return value.includes(';base64,') && value.split(',')[1]?.length > 0;
  }

  // Accept raw base64 (without prefix)
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return base64Regex.test(value) && value.length > 100; // Minimum plausible image
}

/**
 * Validates a location code string:
 * - Must be 1–50 characters (backend constraint: len > 50 → 422)
 * - Alphanumeric + hyphens + underscores only
 */
export function validateLocationCode(code: string): boolean {
  if (!code || code.length > 50) return false;
  return /^[\w-]{1,50}$/.test(code);
}
