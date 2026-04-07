import { hashApiKey } from "@/lib/api-keys";
import { db } from "@/lib/db/client";
import { apiKeysTable } from "@/lib/db/schema/api-key";
import { usersTable } from "@/lib/db/schema/user";
import type { Tier } from "@/lib/tier";
import { isProUser } from "@/lib/tier";
import { and, eq, isNull } from "drizzle-orm";
import { after } from "next/server";

export type ApiKeyUser = {
  id: string;
  tier: Tier;
  username: string;
};

/**
 * Authenticate an API request and return user info with tier.
 *
 * Returns null if no valid API key is provided.
 */
export async function authenticateApiRequest(request: Request): Promise<null | ApiKeyUser> {
  const authHeader = request.headers.get("authorization");

  if (authHeader == null || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const rawKey = authHeader.slice("Bearer ".length);

  if (!rawKey.startsWith("anc_k_")) {
    return null;
  }

  const keyHash = hashApiKey(rawKey);

  const result = await db
    .select({
      apiKeyId: apiKeysTable.id,
      proExpiresAt: usersTable.proExpiresAt,
      tier: usersTable.tier,
      userId: usersTable.id,
      username: usersTable.username,
    })
    .from(apiKeysTable)
    .innerJoin(usersTable, eq(apiKeysTable.userId, usersTable.id))
    .where(and(eq(apiKeysTable.keyHash, keyHash), isNull(apiKeysTable.revokedAt)))
    .limit(1);

  const row = result[0];

  if (row == null) {
    return null;
  }

  // Fire-and-forget: update lastUsedAt
  after(async () => {
    await db.update(apiKeysTable).set({ lastUsedAt: new Date() }).where(eq(apiKeysTable.id, row.apiKeyId));
  });

  return {
    id: row.userId,
    tier: isProUser({ proExpiresAt: row.proExpiresAt, tier: row.tier }) ? "pro" : "free",
    username: row.username,
  };
}
