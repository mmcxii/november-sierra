"use server";

import { db } from "@/lib/db/client";
import { shortLinksTable } from "@/lib/db/schema/short-link";
import { shortSlugsTable } from "@/lib/db/schema/short-slug";
import { envSchema } from "@/lib/env";
import { verifyPassword } from "@/lib/utils/password";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { eq } from "drizzle-orm";

// ─── Rate Limiter ───────────────────────────────────────────────────────────

let unlockLimiter: undefined | Ratelimit;

function getUnlockLimiter(): Ratelimit {
  if (unlockLimiter == null) {
    unlockLimiter = new Ratelimit({
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      redis: new Redis({
        token: envSchema.UPSTASH_REDIS_REST_TOKEN,
        url: envSchema.UPSTASH_REDIS_REST_URL,
      }),
    });
  }
  return unlockLimiter;
}

export type VerifyResult =
  | { error: "expired" | "incorrectPassword" | "notFound" | "rateLimited"; success: false }
  | { success: true; url: string };

export async function verifyShortLinkPassword(slug: string, password: string): Promise<VerifyResult> {
  const limiter = getUnlockLimiter();
  const { success: allowed } = await limiter.limit(`unlock:${slug}`);

  if (!allowed) {
    return { error: "rateLimited", success: false };
  }

  const [slugRow] = await db
    .select({
      shortLinkId: shortSlugsTable.shortLinkId,
      tombstoned: shortSlugsTable.tombstoned,
    })
    .from(shortSlugsTable)
    .where(eq(shortSlugsTable.slug, slug.toLowerCase()))
    .limit(1);

  if (slugRow == null || slugRow.tombstoned || slugRow.shortLinkId == null) {
    return { error: "notFound", success: false };
  }

  const [shortLink] = await db
    .select({
      expiresAt: shortLinksTable.expiresAt,
      passwordHash: shortLinksTable.passwordHash,
      url: shortLinksTable.url,
    })
    .from(shortLinksTable)
    .where(eq(shortLinksTable.id, slugRow.shortLinkId))
    .limit(1);

  if (shortLink == null || shortLink.passwordHash == null) {
    return { error: "notFound", success: false };
  }

  if (shortLink.expiresAt != null && shortLink.expiresAt < new Date()) {
    return { error: "expired", success: false };
  }

  const valid = await verifyPassword(password, shortLink.passwordHash);

  if (!valid) {
    return { error: "incorrectPassword", success: false };
  }

  return { success: true, url: shortLink.url };
}
