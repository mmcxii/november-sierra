import { createHash } from "crypto";

const API_KEY_PREFIX = "anc_k_";
const API_KEY_LENGTH = 32;
const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const FREE_API_KEY_LIMIT = 1;

/**
 * Generate a random API key: `anc_k_` + 32 alphanumeric characters (~190 bits entropy).
 */
export function generateApiKey(): string {
  const bytes = new Uint8Array(API_KEY_LENGTH);
  crypto.getRandomValues(bytes);

  let key = API_KEY_PREFIX;
  for (let i = 0; i < API_KEY_LENGTH; i++) {
    key += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }

  return key;
}

/**
 * SHA-256 hash a raw API key for storage.
 */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Extract the display prefix from a raw key (e.g. `anc_k_a1b2`).
 */
export function getKeyPrefix(rawKey: string): string {
  const body = rawKey.slice(API_KEY_PREFIX.length);
  return API_KEY_PREFIX + body.slice(0, 4);
}

/**
 * Extract the display suffix from a raw key (last 4 chars).
 */
export function getKeySuffix(rawKey: string): string {
  return rawKey.slice(-4);
}

/**
 * Format a masked key for display: `anc_k_XXXX••••XXXX`.
 */
export function formatMaskedKey(prefix: string, suffix: string): string {
  return `${prefix}••••${suffix}`;
}

/**
 * Validate an API key name.
 * - Required, max 64 characters
 * - Allowed: letters, numbers, spaces, hyphens, underscores
 */
export function isValidApiKeyName(name: string): boolean {
  if (name.length === 0 || name.length > 64) {
    return false;
  }

  return /^[a-zA-Z0-9 \-_]+$/.test(name);
}
