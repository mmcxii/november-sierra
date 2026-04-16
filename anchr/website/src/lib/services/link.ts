import type { ApiKeyUser } from "@/lib/api/auth";
import { API_ERROR_CODES } from "@/lib/api/errors";
import type { CreateLinkInput, UpdateLinkInput } from "@/lib/api/schemas/link";
import { db } from "@/lib/db/client";
import { generateUniqueSlug } from "@/lib/db/queries/link";
import { isSlugAvailable } from "@/lib/db/queries/slug";
import { linksTable } from "@/lib/db/schema/link";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { detectPlatform } from "@/lib/platforms";
import { FREE_LINK_LIMIT } from "@/lib/tier";
import { ensureProtocol, generateSlug, isSafeUrl, urlResolves } from "@/lib/utils/url";
import { and, asc, count, eq, inArray, not, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assignBioLinkShortSlug } from "./bio-link-short-slug";
import { serviceError, serviceSuccess, type ServiceResult } from "./types";

export type LinkResponse = {
  copyValue: null | string;
  createdAt: Date;
  groupId: null | string;
  icon: null | string;
  id: string;
  isFeatured: boolean;
  platform: null | string;
  position: number;
  slug: string;
  title: string;
  url: string;
  visible: boolean;
};

export type LinkMutationResponse = {
  createdAt: string;
  groupId: null | string;
  id: string;
  isFeatured: boolean;
  platform: null | string;
  position: number;
  slug: string;
  title: string;
  url: string;
  visible: boolean;
};

function toLinkResponse(link: typeof linksTable.$inferSelect): LinkMutationResponse {
  return {
    createdAt: link.createdAt.toISOString(),
    groupId: link.groupId,
    id: link.id,
    isFeatured: link.isFeatured,
    platform: link.platform,
    position: link.position,
    slug: link.slug,
    title: link.title,
    url: link.url,
    visible: link.visible,
  };
}

export async function listLinks(user: ApiKeyUser): Promise<ServiceResult<LinkResponse[]>> {
  const links = await db
    .select({
      copyValue: linksTable.copyValue,
      createdAt: linksTable.createdAt,
      groupId: linksTable.groupId,
      icon: linksTable.icon,
      id: linksTable.id,
      isFeatured: linksTable.isFeatured,
      platform: linksTable.platform,
      position: linksTable.position,
      slug: linksTable.slug,
      title: linksTable.title,
      url: linksTable.url,
      visible: linksTable.visible,
    })
    .from(linksTable)
    .where(eq(linksTable.userId, user.id))
    .orderBy(asc(linksTable.position));

  return serviceSuccess(links);
}

export async function createLink(
  user: ApiKeyUser,
  input: CreateLinkInput,
): Promise<ServiceResult<LinkMutationResponse>> {
  const { groupId, slug: customSlug, title, url } = input;

  // Enforce free tier link limit
  if (user.tier !== "pro") {
    const [{ count: linkCount }] = await db
      .select({ count: count() })
      .from(linksTable)
      .where(eq(linksTable.userId, user.id));

    if (linkCount >= FREE_LINK_LIMIT) {
      return serviceError(
        API_ERROR_CODES.LINK_LIMIT_REACHED,
        "Free tier is limited to 5 links. Upgrade to Pro for unlimited links.",
        403,
      );
    }
  }

  const fullUrl = ensureProtocol(url);

  if (!isSafeUrl(fullUrl)) {
    return serviceError(API_ERROR_CODES.UNSAFE_URL, "This URL is not allowed.", 400);
  }

  if (!(await urlResolves(fullUrl))) {
    return serviceError(API_ERROR_CODES.URL_UNREACHABLE, "This URL could not be reached.", 400);
  }

  // Validate group ownership
  const resolvedGroupId = groupId != null && groupId.length > 0 ? groupId : null;

  if (resolvedGroupId != null) {
    const [group] = await db
      .select({ id: linkGroupsTable.id })
      .from(linkGroupsTable)
      .where(and(eq(linkGroupsTable.id, resolvedGroupId), eq(linkGroupsTable.userId, user.id)))
      .limit(1);

    if (group == null) {
      return serviceError(API_ERROR_CODES.NOT_FOUND, "Group not found.", 404);
    }
  }

  // Generate or validate slug
  const slug = customSlug != null && customSlug.length > 0 ? customSlug : await generateUniqueSlug(user.id, fullUrl);

  if (customSlug != null && customSlug.length > 0 && !(await isSlugAvailable(user.id, slug))) {
    return serviceError(API_ERROR_CODES.PATH_ALREADY_IN_USE, "This path is already in use.", 409);
  }

  const maxPosition = await db
    .select({ max: sql<number>`coalesce(max(${linksTable.position}), -1)` })
    .from(linksTable)
    .where(eq(linksTable.userId, user.id));

  const platform = detectPlatform(fullUrl);

  const [created] = await db
    .insert(linksTable)
    .values({
      groupId: resolvedGroupId,
      platform,
      position: (maxPosition[0]?.max ?? -1) + 1,
      slug,
      title,
      url: fullUrl,
      userId: user.id,
    })
    .returning();

  // Auto-generate an anch.to short URL so API-created links match the behavior
  // of dashboard/onboarding/import creation and the migration backfill.
  const shortSlug = await assignBioLinkShortSlug({ linkId: created.id, userId: user.id });

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return serviceSuccess(toLinkResponse({ ...created, shortSlug }));
}

export async function updateLink(
  user: ApiKeyUser,
  id: string,
  input: UpdateLinkInput,
): Promise<ServiceResult<LinkMutationResponse>> {
  // Fetch existing link
  const [existing] = await db
    .select()
    .from(linksTable)
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)))
    .limit(1);

  if (existing == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Link not found.", 404);
  }

  const { groupId, slug: customSlug, title, url } = input;
  const updates: Record<string, unknown> = {};

  if (title !== undefined) {
    updates.title = title;
  }

  if (url !== undefined) {
    const fullUrl = ensureProtocol(url);

    if (!isSafeUrl(fullUrl)) {
      return serviceError(API_ERROR_CODES.UNSAFE_URL, "This URL is not allowed.", 400);
    }

    if (!(await urlResolves(fullUrl))) {
      return serviceError(API_ERROR_CODES.URL_UNREACHABLE, "This URL could not be reached.", 400);
    }

    updates.url = fullUrl;
    updates.platform = detectPlatform(fullUrl);

    // Regenerate slug if domain changed and no custom slug provided
    if (customSlug === undefined) {
      const oldSlug = generateSlug(existing.url);
      const newSlug = generateSlug(fullUrl);
      if (oldSlug !== newSlug) {
        updates.slug = await generateUniqueSlug(user.id, fullUrl);
      }
    }
  }

  if (customSlug !== undefined && customSlug.length > 0) {
    if (customSlug !== existing.slug && !(await isSlugAvailable(user.id, customSlug, { linkId: id }))) {
      return serviceError(API_ERROR_CODES.PATH_ALREADY_IN_USE, "This path is already in use.", 409);
    }
    updates.slug = customSlug;
  }

  if (groupId !== undefined) {
    if (groupId != null && groupId.length > 0) {
      const [group] = await db
        .select({ id: linkGroupsTable.id })
        .from(linkGroupsTable)
        .where(and(eq(linkGroupsTable.id, groupId), eq(linkGroupsTable.userId, user.id)))
        .limit(1);

      if (group == null) {
        return serviceError(API_ERROR_CODES.NOT_FOUND, "Group not found.", 404);
      }
      updates.groupId = groupId;
    } else {
      updates.groupId = null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return serviceSuccess(toLinkResponse(existing));
  }

  const [updated] = await db
    .update(linksTable)
    .set(updates)
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)))
    .returning();

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return serviceSuccess(toLinkResponse(updated));
}

export async function deleteLink(user: ApiKeyUser, id: string): Promise<ServiceResult<null>> {
  const deleted = await db.delete(linksTable).where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)));

  if (deleted.rowCount === 0) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Link not found.", 404);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return serviceSuccess(null);
}

export type ReorderItem = { id: string; position: number };

export async function reorderLinks(user: ApiKeyUser, items: ReorderItem[]): Promise<ServiceResult<null>> {
  const ids = items.map((item) => item.id);

  // Verify ownership
  const owned = await db
    .select({ id: linksTable.id })
    .from(linksTable)
    .where(and(inArray(linksTable.id, ids), eq(linksTable.userId, user.id)));

  if (owned.length !== ids.length) {
    return serviceError(API_ERROR_CODES.FORBIDDEN, "One or more links not found.", 403);
  }

  const sqlChunks = [sql`CASE`];
  for (const item of items) {
    sqlChunks.push(sql`WHEN ${linksTable.id} = ${item.id} THEN ${item.position}`);
  }
  sqlChunks.push(sql`ELSE ${linksTable.position} END`);

  await db
    .update(linksTable)
    .set({ position: sql.join(sqlChunks, sql` `) })
    .where(and(inArray(linksTable.id, ids), eq(linksTable.userId, user.id)));

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return serviceSuccess(null);
}

export async function toggleLinkVisibility(
  user: ApiKeyUser,
  id: string,
): Promise<ServiceResult<{ id: string; visible: boolean }>> {
  const [updated] = await db
    .update(linksTable)
    .set({ visible: not(linksTable.visible) })
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)))
    .returning({ id: linksTable.id, visible: linksTable.visible });

  if (updated == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Link not found.", 404);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return serviceSuccess({ id: updated.id, visible: updated.visible });
}

export async function toggleFeaturedLink(
  user: ApiKeyUser,
  id: string,
): Promise<ServiceResult<{ id: string; isFeatured: boolean }>> {
  if (user.tier !== "pro") {
    return serviceError(API_ERROR_CODES.PRO_REQUIRED, "This endpoint requires a Pro subscription.", 403);
  }

  const [link] = await db
    .select({ id: linksTable.id, isFeatured: linksTable.isFeatured })
    .from(linksTable)
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, user.id)))
    .limit(1);

  if (link == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Link not found.", 404);
  }

  const newFeatured = !link.isFeatured;

  // Single atomic UPDATE: set the target link's featured state and
  // unfeature any other link in one statement (no transaction needed).
  await db
    .update(linksTable)
    .set({
      isFeatured: sql`CASE WHEN ${linksTable.id} = ${id} THEN ${newFeatured} ELSE false END`,
    })
    .where(
      and(
        eq(linksTable.userId, user.id),
        // Only touch the target link and any currently-featured link
        sql`(${linksTable.id} = ${id} OR ${linksTable.isFeatured} = true)`,
      ),
    );

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return serviceSuccess({ id: link.id, isFeatured: !link.isFeatured });
}
