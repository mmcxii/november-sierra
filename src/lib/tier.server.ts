import { eq } from "drizzle-orm";
import type { SessionUser } from "./auth";
import { db } from "./db/client";
import { usersTable } from "./db/schema/user";

export async function grantPro(userId: string, durationDays: null | number): Promise<void> {
  if (durationDays == null) {
    await db
      .update(usersTable)
      .set({ proExpiresAt: null, tier: "pro", updatedAt: new Date() })
      .where(eq(usersTable.id, userId));
    return;
  }

  const [user] = await db
    .select({ proExpiresAt: usersTable.proExpiresAt, tier: usersTable.tier })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (user == null) {
    return;
  }

  // Stack on existing expiration if user is already pro with time remaining
  const baseDate =
    user.tier === "pro" && user.proExpiresAt != null && user.proExpiresAt > new Date() ? user.proExpiresAt : new Date();

  const expiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  await db
    .update(usersTable)
    .set({ proExpiresAt: expiresAt, tier: "pro", updatedAt: new Date() })
    .where(eq(usersTable.id, userId));
}

export async function cleanupExpiredPro(user: SessionUser): Promise<SessionUser> {
  if (user.tier !== "pro" || user.proExpiresAt == null || user.proExpiresAt >= new Date()) {
    return user;
  }

  await db
    .update(usersTable)
    .set({ proExpiresAt: null, tier: "free", updatedAt: new Date() })
    .where(eq(usersTable.id, user.id));

  return { ...user, proExpiresAt: null, tier: "free" };
}
