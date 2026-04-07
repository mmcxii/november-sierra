export type Tier = "free" | "pro";

export const FREE_LINK_LIMIT = 5;

export function isProUser(user: { proExpiresAt: null | Date; tier: string }): boolean {
  if (user.tier !== "pro") {
    return false;
  }

  if (user.proExpiresAt != null && user.proExpiresAt < new Date()) {
    return false;
  }

  return true;
}
