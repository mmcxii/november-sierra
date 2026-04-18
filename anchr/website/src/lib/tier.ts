export type Tier = "free" | "pro";

export const FREE_LINK_LIMIT = 5;

export const FREE_TIER_SHORT_LINK_MONTHLY_CAP = 20;

export function isProUser(user: { proExpiresAt: null | Date; tier: string }): boolean {
  if (user.tier !== "pro") {
    return false;
  }

  if (user.proExpiresAt != null && user.proExpiresAt < new Date()) {
    return false;
  }

  return true;
}

/** First instant of the next UTC calendar month — the reset point for the
 *  monthly short-link cap on free tier. Strict counting is rooted in this
 *  boundary: the service counts creations with `created_at >= start of current
 *  UTC month` and this function returns `start of next UTC month`, so the
 *  value clients see as `resetsAt` matches what the query will stop counting
 *  on. */
export function getShortLinkQuotaResetsAt(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}
