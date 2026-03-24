import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
import { envSchema } from "@/lib/env";
import { refreshNostrProfile } from "@/lib/nostr-profile";
import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (envSchema.CRON_SECRET == null || authHeader !== `Bearer ${envSchema.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const users = await db
    .select({
      id: usersTable.id,
      nostrNpub: usersTable.nostrNpub,
      nostrRelays: usersTable.nostrRelays,
    })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.useNostrProfile, true),
        sql`${usersTable.nostrNpub} IS NOT NULL`,
        or(isNull(usersTable.nostrProfileFetchedAt), lt(usersTable.nostrProfileFetchedAt, staleThreshold)),
      ),
    );

  let refreshed = 0;

  for (const user of users) {
    try {
      await refreshNostrProfile(user);
      refreshed++;
    } catch (error) {
      console.error(`[refresh-nostr-profiles] Failed for user ${user.id}:`, error);
    }
  }

  return NextResponse.json({ refreshed, total: users.length });
}
