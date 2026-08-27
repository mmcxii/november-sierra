import { createHash } from "node:crypto";

export const API_KEY_PREFIX = "sf_k_";
export const API_KEY_LIMIT = 5;
const API_KEY_LENGTH = 32;
const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Generate a random API key: `sf_k_` + 32 alphanumeric characters. */
export function generateApiKey(): string {
  const bytes = new Uint8Array(API_KEY_LENGTH);
  crypto.getRandomValues(bytes);

  let key = API_KEY_PREFIX;
  for (let i = 0; i < API_KEY_LENGTH; i += 1) {
    const byte = bytes[i] ?? 0;
    key += ALPHANUMERIC[byte % ALPHANUMERIC.length];
  }

  return key;
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function getKeyPrefix(rawKey: string): string {
  const body = rawKey.slice(API_KEY_PREFIX.length);
  return API_KEY_PREFIX + body.slice(0, 4);
}

export function getKeySuffix(rawKey: string): string {
  return rawKey.slice(-4);
}

export function formatMaskedKey(prefix: string, suffix: string): string {
  return `${prefix}••••${suffix}`;
}

export function isValidApiKeyName(name: string): boolean {
  if (name.length === 0 || name.length > 64) {
    return false;
  }
  return /^[a-zA-Z0-9 \-_]+$/.test(name);
}

export function mcpClientConfig(mcpUrl: string, apiKeyPlaceholder = "sf_k_YOUR_KEY"): string {
  return JSON.stringify(
    {
      mcpServers: {
        seventyfive: {
          headers: {
            Authorization: `Bearer ${apiKeyPlaceholder}`,
          },
          url: mcpUrl,
        },
      },
    },
    null,
    2,
  );
}
