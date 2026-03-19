"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { generateUniqueSlug } from "@/lib/db/queries/link";
import { linksTable } from "@/lib/db/schema/link";
import { detectPlatform } from "@/lib/platforms";
import { linkSchema } from "@/lib/schemas/link";
import { FREE_LINK_LIMIT } from "@/lib/tier";
import { ensureProtocol, generateSlug, urlResolves } from "@/lib/utils/url";
import { and, count, eq, inArray, not, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function revalidatePages(username: string): void {
  revalidatePath("/dashboard");
  revalidatePath(`/${username}`);
}

export type ActionResult = {
  error?: string;
  success: boolean;
};

export async function createLink(
  title: string,
  url: string,
  customSlug?: string,
  skipUrlCheck?: boolean,
): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (user.tier !== "pro") {
    const [{ count: linkCount }] = await db
      .select({ count: count() })
      .from(linksTable)
      .where(eq(linksTable.userId, user.id));

    if (linkCount >= FREE_LINK_LIMIT) {
      return { error: "youveReachedTheFreeLimit", success: false };
    }
  }

  const result = linkSchema.safeParse({ title, url });

  if (!result.success) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const fullUrl = ensureProtocol(result.data.url);

  if (!skipUrlCheck && !(await urlResolves(fullUrl))) {
    return { error: "thisUrlCouldNotBeReachedPleaseCheckItAndTryAgain", success: false };
  }

  const slug = customSlug != null && customSlug.length > 0 ? customSlug : await generateUniqueSlug(user.id, fullUrl);

  const maxPosition = await db
    .select({ max: sql<number>`coalesce(max(${linksTable.position}), -1)` })
    .from(linksTable)
    .where(eq(linksTable.userId, user.id));

  const platform = detectPlatform(fullUrl);

  await db.insert(linksTable).values({
    platform,
    position: (maxPosition[0]?.max ?? -1) + 1,
    slug,
    title: result.data.title,
    url: fullUrl,
    userId: user.id,
  });

  revalidatePages(user.username);

  return { success: true };
}

export async function updateLink(
  id: string,
  title: string,
  url: string,
  customSlug?: string,
  skipUrlCheck?: boolean,
): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const result = linkSchema.safeParse({ title, url });

  if (!result.success) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const fullUrl = ensureProtocol(result.data.url);

  if (!skipUrlCheck && !(await urlResolves(fullUrl))) {
    return { error: "thisUrlCouldNotBeReachedPleaseCheckItAndTryAgain", success: false };
  }

  // Check if domain changed — regenerate slug if so
  const existingLinks = await db
    .select({ slug: linksTable.slug, url: linksTable.url })
    .from(linksTable)
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)))
    .limit(1);

  const existingLink = existingLinks[0];

  if (existingLink == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  let slug: string;
  if (customSlug != null && customSlug.length > 0) {
    slug = customSlug;
  } else {
    const oldSlug = generateSlug(existingLink.url);
    const newSlug = generateSlug(fullUrl);
    slug = oldSlug !== newSlug ? await generateUniqueSlug(user.id, fullUrl) : existingLink.slug;
  }

  const platform = detectPlatform(fullUrl);

  const updated = await db
    .update(linksTable)
    .set({ platform, slug, title: result.data.title, url: fullUrl })
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)));

  if (updated.rowCount === 0) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  revalidatePages(user.username);

  return { success: true };
}

export async function reorderLinks(items: { id: string; position: number }[]): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
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
    .where(and(inArray(linksTable.id, ids), eq(linksTable.userId, user.id)));

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
    .where(and(inArray(linksTable.id, ids), eq(linksTable.userId, user.id)));

  revalidatePages(user.username);

  return { success: true };
}

export async function toggleLinkVisibility(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const result = await db
    .update(linksTable)
    .set({ visible: not(linksTable.visible) })
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)));

  if (result.rowCount === 0) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  revalidatePages(user.username);

  return { success: true };
}

export async function bulkDeleteLinks(ids: string[]): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (ids.length === 0) {
    return { success: true };
  }

  const deleted = await db.delete(linksTable).where(and(inArray(linksTable.id, ids), eq(linksTable.userId, user.id)));

  if (deleted.rowCount !== ids.length) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  revalidatePages(user.username);

  return { success: true };
}

export async function bulkUpdateVisibility(ids: string[], visible: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (ids.length === 0) {
    return { success: true };
  }

  const updated = await db
    .update(linksTable)
    .set({ visible })
    .where(and(inArray(linksTable.id, ids), eq(linksTable.userId, user.id)));

  if (updated.rowCount !== ids.length) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  revalidatePages(user.username);

  return { success: true };
}

export async function deleteLink(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const deleted = await db.delete(linksTable).where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)));

  if (deleted.rowCount === 0) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  revalidatePages(user.username);

  return { success: true };
}
