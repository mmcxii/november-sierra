import { and, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { linkGroupsTable } from "../schema/link-group";

/**
 * Ensures a Quick Links group exists for the given user.
 * Idempotent — safe to call multiple times.
 */
export async function ensureQuickLinksGroup(userId: string): Promise<void> {
  const existing = await db
    .select({ id: linkGroupsTable.id })
    .from(linkGroupsTable)
    .where(and(eq(linkGroupsTable.userId, userId), eq(linkGroupsTable.isQuickLinks, true)))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  // Shift all existing group positions up by 1 to make room at position 0
  await db
    .update(linkGroupsTable)
    .set({ position: sql`${linkGroupsTable.position} + 1` })
    .where(eq(linkGroupsTable.userId, userId));

  await db.insert(linkGroupsTable).values({
    isQuickLinks: true,
    position: 0,
    title: "Quick Links",
    userId,
  });
}
