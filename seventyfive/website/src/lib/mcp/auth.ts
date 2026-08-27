import { API_KEY_PREFIX, hashApiKey } from "@/lib/api-keys";
import { db } from "@/lib/db/client";
import { apiKeysTable, betterAuthUserTable } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { after } from "next/server";
import type { McpUser } from "./types";

export async function authenticateApiRequest(request: Request): Promise<null | McpUser> {
  const authHeader = request.headers.get("authorization");
  if (authHeader == null || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const rawKey = authHeader.slice("Bearer ".length);
  if (!rawKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashApiKey(rawKey);
  const result = await db
    .select({
      apiKeyId: apiKeysTable.id,
      timeZone: betterAuthUserTable.timeZone,
      userId: betterAuthUserTable.id,
      username: betterAuthUserTable.username,
    })
    .from(apiKeysTable)
    .innerJoin(betterAuthUserTable, eq(apiKeysTable.userId, betterAuthUserTable.id))
    .where(and(eq(apiKeysTable.keyHash, keyHash), isNull(apiKeysTable.revokedAt)))
    .limit(1);

  const row = result[0];
  if (row == null) {
    return null;
  }

  after(async () => {
    await db.update(apiKeysTable).set({ lastUsedAt: new Date() }).where(eq(apiKeysTable.id, row.apiKeyId));
  });

  return {
    id: row.userId,
    timeZone: row.timeZone,
    username: row.username,
  };
}
