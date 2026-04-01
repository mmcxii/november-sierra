/**
 * Edge-compatible API key hashing using Web Crypto API.
 *
 * The main `api-keys.ts` uses Node.js `crypto.createHash` which is unavailable
 * in Edge Runtime. This module provides an equivalent SHA-256 hash for use in
 * middleware.
 */

/**
 * SHA-256 hash a raw API key using the Web Crypto API (Edge-compatible).
 */
export async function hashApiKeyEdge(rawKey: string): Promise<string> {
  const encoded = new TextEncoder().encode(rawKey);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = new Uint8Array(digest);

  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }

  return hex;
}
