import { envSchema } from "@/lib/env";

let cached: null | Set<string> = null;

function parseWhitelist(): Set<string> {
  if (cached != null) {
    return cached;
  }

  const ids = new Set<string>();
  const raw = envSchema.AUTH_WHITELIST_USER_IDS;
  if (raw != null && raw.length > 0) {
    for (const id of raw.split(",")) {
      const trimmed = id.trim();
      if (trimmed.length > 0) {
        ids.add(trimmed);
      }
    }
  }
  // Admin is always implicitly whitelisted so the Shot 1 bake window has at
  // least one tester without requiring an extra env var.
  if (envSchema.ADMIN_USER_ID != null && envSchema.ADMIN_USER_ID.length > 0) {
    ids.add(envSchema.ADMIN_USER_ID);
  }

  cached = ids;
  return ids;
}

export function isWhitelistedForBetterAuth(userId: undefined | null | string): boolean {
  if (userId == null || userId.length === 0) {
    return false;
  }
  return parseWhitelist().has(userId);
}

// Test-only reset — production never needs to invalidate the cache because
// the whitelist is bound to deploy-time env vars.
export function resetWhitelistCacheForTesting(): void {
  cached = null;
}
