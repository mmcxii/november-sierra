"use server";

import { type SessionUser, getCurrentUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { generateUniqueSlug } from "@/lib/db/queries/link";
import { generateUniqueGroupSlug, isSlugAvailable } from "@/lib/db/queries/slug";
import { linksTable } from "@/lib/db/schema/link";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { detectPlatform } from "@/lib/platforms";
import { linkSchema } from "@/lib/schemas/link";
import { groupSchema } from "@/lib/schemas/link-group";
import { assignBioLinkShortSlug } from "@/lib/services/bio-link-short-slug";
import { FREE_LINK_LIMIT, isProUser } from "@/lib/tier";
import { ensureProtocol, generateSlug, isSafeUrl, urlResolves } from "@/lib/utils/url";
import { and, count, eq, inArray, not, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function isRedirectLoop(user: SessionUser, url: string): boolean {
  if (!user.customDomainVerified || user.customDomain == null) {
    return false;
  }
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === user.customDomain;
  } catch {
    return false;
  }
}

function revalidatePages(username: string): void {
  revalidatePath("/dashboard");
  revalidatePath(`/${username}`);
}

export type ActionResult = {
  error?: string;
  success: boolean;
};

// ─── Link Actions ────────────────────────────────────────────────────────────

export async function createLink(
  title: string,
  url: string,
  customSlug?: string,
  skipUrlCheck?: boolean,
  groupId?: string,
  icon?: null | string,
  copyValue?: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (!isProUser(user)) {
    const [{ count: linkCount }] = await db
      .select({ count: count() })
      .from(linksTable)
      .where(eq(linksTable.userId, user.id));

    if (linkCount >= FREE_LINK_LIMIT) {
      return { error: "youveReachedTheFreeLimitUpgradeToProForUnlimitedLinks", success: false };
    }
  }

  const result = linkSchema.safeParse({ groupId, title, url });

  if (!result.success) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const fullUrl = ensureProtocol(result.data.url);

  if (!isSafeUrl(fullUrl, { allowInternalHosts: isAdmin(user.id) })) {
    return { error: "thisUrlIsNotAllowed", success: false };
  }

  if (isRedirectLoop(user, fullUrl)) {
    return { error: "thisUrlIsNotAllowed", success: false };
  }

  if (!skipUrlCheck && !(await urlResolves(fullUrl))) {
    return { error: "thisUrlCouldNotBeReachedPleaseCheckItAndTryAgain", success: false };
  }

  // Validate group ownership if groupId is provided
  const resolvedGroupId = groupId != null && groupId.length > 0 ? groupId : null;

  if (resolvedGroupId != null) {
    const group = await db
      .select({ id: linkGroupsTable.id })
      .from(linkGroupsTable)
      .where(and(eq(linkGroupsTable.id, resolvedGroupId), eq(linkGroupsTable.userId, user.id)))
      .limit(1);

    if (group.length === 0) {
      return { error: "somethingWentWrongPleaseTryAgain", success: false };
    }
  }

  const slug = customSlug != null && customSlug.length > 0 ? customSlug : await generateUniqueSlug(user.id, fullUrl);

  if (customSlug != null && customSlug.length > 0 && !(await isSlugAvailable(user.id, slug))) {
    return { error: "thisPathIsAlreadyInUse", success: false };
  }

  const maxPosition = await db
    .select({ max: sql<number>`coalesce(max(${linksTable.position}), -1)` })
    .from(linksTable)
    .where(eq(linksTable.userId, user.id));

  const platform = copyValue != null ? "nostr" : detectPlatform(fullUrl);
  const linkId = crypto.randomUUID();

  await db.insert(linksTable).values({
    copyValue: copyValue ?? null,
    groupId: resolvedGroupId,
    icon: isProUser(user) ? (icon ?? null) : null,
    id: linkId,
    platform,
    position: (maxPosition[0]?.max ?? -1) + 1,
    slug,
    title: result.data.title,
    url: fullUrl,
    userId: user.id,
  });

  // Auto-generate an anch.to short URL for the new bio link. Mirrors the
  // migration backfill so links created post-migration behave identically.
  await assignBioLinkShortSlug({ linkId, userId: user.id });

  revalidatePages(user.username);

  return { success: true };
}

export async function updateLink(
  id: string,
  title: string,
  url: string,
  customSlug?: string,
  skipUrlCheck?: boolean,
  groupId?: null | string,
  icon?: null | string,
  copyValue?: null | string,
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

  if (!isSafeUrl(fullUrl, { allowInternalHosts: isAdmin(user.id) })) {
    return { error: "thisUrlIsNotAllowed", success: false };
  }

  if (isRedirectLoop(user, fullUrl)) {
    return { error: "thisUrlIsNotAllowed", success: false };
  }

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

  // Validate group ownership if groupId is provided
  const resolvedGroupId = groupId != null && groupId.length > 0 ? groupId : null;

  if (resolvedGroupId != null) {
    const group = await db
      .select({ id: linkGroupsTable.id })
      .from(linkGroupsTable)
      .where(and(eq(linkGroupsTable.id, resolvedGroupId), eq(linkGroupsTable.userId, user.id)))
      .limit(1);

    if (group.length === 0) {
      return { error: "somethingWentWrongPleaseTryAgain", success: false };
    }
  }

  const platform = copyValue != null ? "nostr" : detectPlatform(fullUrl);

  const updateFields: Record<string, unknown> = {
    platform,
    slug,
    title: result.data.title,
    url: fullUrl,
  };

  // Only update groupId if explicitly passed (undefined = don't change, null = ungroup, string = set group)
  if (groupId !== undefined) {
    updateFields.groupId = resolvedGroupId;
  }

  // Only update icon if explicitly passed (undefined = don't change)
  if (icon !== undefined) {
    updateFields.icon = isProUser(user) ? (icon ?? null) : null;
  }

  // Only update copyValue if explicitly passed (undefined = don't change, null = clear, string = set)
  if (copyValue !== undefined) {
    updateFields.copyValue = copyValue;
  }

  const updated = await db
    .update(linksTable)
    .set(updateFields)
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)));

  if (updated.rowCount === 0) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  revalidatePages(user.username);

  return { success: true };
}

export async function updateLinkGroup(linkId: string, groupId: null | string): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  // Validate group ownership if groupId is provided
  if (groupId != null) {
    const group = await db
      .select({ id: linkGroupsTable.id })
      .from(linkGroupsTable)
      .where(and(eq(linkGroupsTable.id, groupId), eq(linkGroupsTable.userId, user.id)))
      .limit(1);

    if (group.length === 0) {
      return { error: "somethingWentWrongPleaseTryAgain", success: false };
    }
  }

  const updated = await db
    .update(linksTable)
    .set({ groupId })
    .where(and(eq(linksTable.id, linkId), eq(linksTable.userId, user.id)));

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

export async function toggleFeaturedLink(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (!isProUser(user)) {
    return { error: "upgradeToPro", success: false };
  }

  const [link] = await db
    .select({ isFeatured: linksTable.isFeatured })
    .from(linksTable)
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)))
    .limit(1);

  if (link == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const newFeatured = !link.isFeatured;

  await db
    .update(linksTable)
    .set({
      isFeatured: sql`CASE WHEN ${linksTable.id} = ${id} THEN ${newFeatured} ELSE false END`,
    })
    .where(and(eq(linksTable.userId, user.id), sql`(${linksTable.id} = ${id} OR ${linksTable.isFeatured} = true)`));

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

// ─── Group Actions ───────────────────────────────────────────────────────────

export async function createGroup(title: string, customSlug?: string): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (!isProUser(user)) {
    return { error: "upgradeToPro", success: false };
  }

  const result = groupSchema.safeParse({ slug: customSlug, title });

  if (!result.success) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const slug =
    customSlug != null && customSlug.length > 0
      ? customSlug.toLowerCase()
      : await generateUniqueGroupSlug(user.id, result.data.title);

  if (customSlug != null && customSlug.length > 0 && !(await isSlugAvailable(user.id, slug))) {
    return { error: "thisPathIsAlreadyInUse", success: false };
  }

  const maxPosition = await db
    .select({ max: sql<number>`coalesce(max(${linkGroupsTable.position}), -1)` })
    .from(linkGroupsTable)
    .where(eq(linkGroupsTable.userId, user.id));

  await db.insert(linkGroupsTable).values({
    position: (maxPosition[0]?.max ?? -1) + 1,
    slug,
    title: result.data.title,
    userId: user.id,
  });

  revalidatePages(user.username);

  return { success: true };
}

export async function updateGroup(id: string, title: string, customSlug?: string): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (!isProUser(user)) {
    return { error: "upgradeToPro", success: false };
  }

  // Prevent renaming the Quick Links group
  const [group] = await db
    .select({ isQuickLinks: linkGroupsTable.isQuickLinks, slug: linkGroupsTable.slug })
    .from(linkGroupsTable)
    .where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)))
    .limit(1);

  if (group == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (group.isQuickLinks) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const result = groupSchema.safeParse({ slug: customSlug, title });

  if (!result.success) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const slug = customSlug != null && customSlug.length > 0 ? customSlug.toLowerCase() : group.slug;

  if (slug != null && slug !== group.slug && !(await isSlugAvailable(user.id, slug, { groupId: id }))) {
    return { error: "thisPathIsAlreadyInUse", success: false };
  }

  const updated = await db
    .update(linkGroupsTable)
    .set({ slug, title: result.data.title })
    .where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)));

  if (updated.rowCount === 0) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  revalidatePages(user.username);

  return { success: true };
}

export async function deleteGroup(id: string, deleteLinks: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (!isProUser(user)) {
    return { error: "upgradeToPro", success: false };
  }

  // Verify ownership and check Quick Links
  const groups = await db
    .select({ id: linkGroupsTable.id, isQuickLinks: linkGroupsTable.isQuickLinks })
    .from(linkGroupsTable)
    .where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)))
    .limit(1);

  if (groups.length === 0) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (groups[0].isQuickLinks) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (deleteLinks) {
    // Delete all links in the group
    await db.delete(linksTable).where(and(eq(linksTable.groupId, id), eq(linksTable.userId, user.id)));
  } else {
    // Ungroup links: set groupId to null
    await db
      .update(linksTable)
      .set({ groupId: null })
      .where(and(eq(linksTable.groupId, id), eq(linksTable.userId, user.id)));
  }

  // Delete the group
  await db.delete(linkGroupsTable).where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)));

  revalidatePages(user.username);

  return { success: true };
}

export async function reorderGroups(items: { id: string; position: number }[]): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (items.length === 0) {
    return { success: true };
  }

  const ids = items.map((item) => item.id);

  // Verify ownership of all groups
  const owned = await db
    .select({ id: linkGroupsTable.id })
    .from(linkGroupsTable)
    .where(and(inArray(linkGroupsTable.id, ids), eq(linkGroupsTable.userId, user.id)));

  if (owned.length !== ids.length) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  // Build CASE WHEN for atomic position update
  const sqlChunks = [sql`CASE`];
  for (const item of items) {
    sqlChunks.push(sql`WHEN ${linkGroupsTable.id} = ${item.id} THEN ${item.position}`);
  }
  sqlChunks.push(sql`ELSE ${linkGroupsTable.position} END`);

  const caseStatement = sql.join(sqlChunks, sql` `);

  await db
    .update(linkGroupsTable)
    .set({ position: caseStatement })
    .where(and(inArray(linkGroupsTable.id, ids), eq(linkGroupsTable.userId, user.id)));

  revalidatePages(user.username);

  return { success: true };
}

export async function toggleGroupVisibility(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const result = await db
    .update(linkGroupsTable)
    .set({ visible: not(linkGroupsTable.visible) })
    .where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)));

  if (result.rowCount === 0) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  revalidatePages(user.username);

  return { success: true };
}
