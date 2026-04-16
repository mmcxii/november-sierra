import { and, eq, sql } from "drizzle-orm";
import type { SessionUser } from "./auth";
import { db } from "./db/client";
import { usersTable } from "./db/schema/user";
import { removeDomain } from "./vercel";

/**
 * Grant Pro access to a user.
 *
 * - `durationDays === null` → lifetime pro. Single UPDATE, clears expiry.
 * - `durationDays === number` → finite expiry, computed ENTIRELY IN SQL via
 *   a CASE expression. Two important properties:
 *
 *     1. **Atomicity.** The stacking math (`existing + days` vs `now + days`)
 *        runs inside one UPDATE, so Postgres's row-level lock serializes
 *        concurrent grants against the same user. Two webhook redeliveries
 *        or a webhook + a referral redemption firing at the same instant
 *        both land — the second UPDATE reads the post-commit expiry and
 *        stacks correctly on top of the first. The previous JS-based
 *        read-modify-write could silently lose one grant's days.
 *
 *     2. **neon-http compatibility.** The production db client uses the
 *        `neon-http` driver, which fires each query as an independent HTTP
 *        request and does NOT support `db.transaction(...)`. Keeping the
 *        mutation as a single statement is the only way this runs in prod.
 *
 * - Lifetime pro users are never overwritten with a finite expiry. The
 *   WHERE clause explicitly excludes `tier = 'pro' AND proExpiresAt IS NULL`
 *   so comped accounts can't be downgraded by a timed grant.
 */
export async function grantPro(userId: string, durationDays: null | number): Promise<void> {
  if (durationDays == null) {
    await db
      .update(usersTable)
      .set({ proExpiresAt: null, tier: "pro", updatedAt: new Date() })
      .where(eq(usersTable.id, userId));
    return;
  }

  await db
    .update(usersTable)
    .set({
      proExpiresAt: sql`CASE
        WHEN ${usersTable.tier} = 'pro' AND ${usersTable.proExpiresAt} > NOW()
          THEN ${usersTable.proExpiresAt} + make_interval(days => ${durationDays})
        ELSE NOW() + make_interval(days => ${durationDays})
      END`,
      tier: "pro",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(usersTable.id, userId),
        // Preserve lifetime pro — never overwrite tier=pro, proExpiresAt=null.
        sql`NOT (${usersTable.tier} = 'pro' AND ${usersTable.proExpiresAt} IS NULL)`,
      ),
    );
}

export async function cleanupExpiredPro(user: SessionUser): Promise<SessionUser> {
  if (user.tier !== "pro" || user.proExpiresAt == null || user.proExpiresAt >= new Date()) {
    return user;
  }

  // Custom profile and short-URL domains are Pro-only features. When referral-
  // granted Pro expires we flip the user back to free, but the domain rows
  // would otherwise continue to resolve via middleware (which doesn't check
  // tier on the hot path for cache reasons). Remove them from Vercel and
  // clear the DB columns in one shot. Mirrors the Stripe handleDowngrade path.
  if (user.customDomain != null) {
    try {
      await removeDomain(user.customDomain);
    } catch (error) {
      console.error("[cleanupExpiredPro] failed to remove custom domain from Vercel:", error);
    }
  }
  if (user.shortDomain != null) {
    try {
      await removeDomain(user.shortDomain);
    } catch (error) {
      console.error("[cleanupExpiredPro] failed to remove short domain from Vercel:", error);
    }
  }

  await db
    .update(usersTable)
    .set({
      customDomain: null,
      customDomainVerified: false,
      ...(user.customDomain != null && { domainRemovedAt: new Date() }),
      proExpiresAt: null,
      shortDomain: null,
      shortDomainVerified: false,
      tier: "free",
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, user.id));

  return {
    ...user,
    customDomain: null,
    customDomainVerified: false,
    proExpiresAt: null,
    shortDomain: null,
    shortDomainVerified: false,
    tier: "free",
  };
}
