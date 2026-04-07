import { hashApiKey } from "@/lib/api-keys";
import { db } from "@/lib/db/client";
import { apiKeysTable } from "@/lib/db/schema/api-key";
import { and, eq, isNull } from "drizzle-orm";
import { after } from "next/server";

/**
 * Authenticate an incoming request via API key bearer token.
 *
 * Flow:
 * 1. Extract `Authorization: Bearer anc_k_...` from headers
 * 2. SHA-256 hash the provided key
 * 3. Look up active (non-revoked) key by hash
 * 4. If found → return userId, update `lastUsedAt` via `after()` (fire-and-forget)
 * 5. If not found → return null
 */
export async function authenticateApiKey(request: Request): Promise<null | string> {
  const authHeader = request.headers.get("authorization");

  if (authHeader == null || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const rawKey = authHeader.slice("Bearer ".length);

  if (!rawKey.startsWith("anc_k_")) {
    return null;
  }

  const keyHash = hashApiKey(rawKey);

  const [apiKey] = await db
    .select({ id: apiKeysTable.id, userId: apiKeysTable.userId })
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.keyHash, keyHash), isNull(apiKeysTable.revokedAt)))
    .limit(1);

  if (apiKey == null) {
    return null;
  }

  // Fire-and-forget: update lastUsedAt without blocking the response
  after(async () => {
    await db.update(apiKeysTable).set({ lastUsedAt: new Date() }).where(eq(apiKeysTable.id, apiKey.id));
  });

  return apiKey.userId;
}
