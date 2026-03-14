"use server";

import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { linkSchema } from "@/lib/schemas/link";
import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray, not, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  error?: string;
  success: boolean;
};

export async function createLink(title: string, url: string): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const result = linkSchema.safeParse({ title, url });

  if (!result.success) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const maxPosition = await db
    .select({ max: sql<number>`coalesce(max(${linksTable.position}), -1)` })
    .from(linksTable)
    .where(eq(linksTable.userId, userId));

  await db.insert(linksTable).values({
    position: (maxPosition[0]?.max ?? -1) + 1,
    title: result.data.title,
    url: result.data.url,
    userId,
  });

  revalidatePath("/dashboard");

  return { success: true };
}

export async function updateLink(id: string, title: string, url: string): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const result = linkSchema.safeParse({ title, url });

  if (!result.success) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const updated = await db
    .update(linksTable)
    .set({ title: result.data.title, url: result.data.url })
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, userId)));

  if (updated.rowCount === 0) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  revalidatePath("/dashboard");

  return { success: true };
}

export async function reorderLinks(items: { id: string; position: number }[]): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (items.length === 0) {
    return { success: true };
  }

  const ids = items.map((item) => item.id);

  // Verify ownership of all links
  const owned = await db
    .select({ id: linksTable.id })
    .from(linksTable)
    .where(and(inArray(linksTable.id, ids), eq(linksTable.userId, userId)));

  if (owned.length !== ids.length) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  // Build CASE WHEN for atomic position update
  const sqlChunks = [sql`CASE`];
  for (const item of items) {
    sqlChunks.push(sql`WHEN ${linksTable.id} = ${item.id} THEN ${item.position}`);
  }
  sqlChunks.push(sql`ELSE ${linksTable.position} END`);

  const caseStatement = sql.join(sqlChunks, sql` `);

  await db
    .update(linksTable)
    .set({ position: caseStatement })
    .where(and(inArray(linksTable.id, ids), eq(linksTable.userId, userId)));

  revalidatePath("/dashboard");

  return { success: true };
}

export async function toggleLinkVisibility(id: string): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const result = await db
    .update(linksTable)
    .set({ visible: not(linksTable.visible) })
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, userId)));

  if (result.rowCount === 0) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  revalidatePath("/dashboard");

  return { success: true };
}

export async function deleteLink(id: string): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const deleted = await db.delete(linksTable).where(and(eq(linksTable.id, id), eq(linksTable.userId, userId)));

  if (deleted.rowCount === 0) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  revalidatePath("/dashboard");

  return { success: true };
}
