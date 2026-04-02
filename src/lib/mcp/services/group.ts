import type { ApiKeyUser } from "@/lib/api/auth";
import { API_ERROR_CODES } from "@/lib/api/errors";
import type { CreateGroupInput, UpdateGroupInput } from "@/lib/api/schemas/group";
import { db } from "@/lib/db/client";
import { generateUniqueGroupSlug, isSlugAvailable } from "@/lib/db/queries/slug";
import { linksTable } from "@/lib/db/schema/link";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { and, asc, eq, inArray, not, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { serviceError, serviceSuccess, type ServiceResult } from "../types";
import { requirePro } from "./require-pro";

export type GroupResponse = {
  createdAt: Date;
  id: string;
  isQuickLinks: boolean;
  position: number;
  slug: null | string;
  title: string;
  visible: boolean;
};

export type GroupMutationResponse = {
  createdAt: string;
  id: string;
  isQuickLinks: boolean;
  position: number;
  slug: null | string;
  title: string;
  visible: boolean;
};

function toGroupResponse(group: typeof linkGroupsTable.$inferSelect): GroupMutationResponse {
  return {
    createdAt: group.createdAt.toISOString(),
    id: group.id,
    isQuickLinks: group.isQuickLinks,
    position: group.position,
    slug: group.slug,
    title: group.title,
    visible: group.visible,
  };
}

export async function listGroups(user: ApiKeyUser): Promise<ServiceResult<GroupResponse[]>> {
  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const groups = await db
    .select({
      createdAt: linkGroupsTable.createdAt,
      id: linkGroupsTable.id,
      isQuickLinks: linkGroupsTable.isQuickLinks,
      position: linkGroupsTable.position,
      slug: linkGroupsTable.slug,
      title: linkGroupsTable.title,
      visible: linkGroupsTable.visible,
    })
    .from(linkGroupsTable)
    .where(eq(linkGroupsTable.userId, user.id))
    .orderBy(asc(linkGroupsTable.position));

  return serviceSuccess(groups);
}

export async function createGroup(
  user: ApiKeyUser,
  input: CreateGroupInput,
): Promise<ServiceResult<GroupMutationResponse>> {
  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const { slug: customSlug, title } = input;

  const slug =
    customSlug != null && customSlug.length > 0
      ? customSlug.toLowerCase()
      : await generateUniqueGroupSlug(user.id, title);

  if (customSlug != null && customSlug.length > 0 && !(await isSlugAvailable(user.id, slug))) {
    return serviceError(API_ERROR_CODES.PATH_ALREADY_IN_USE, "This path is already in use.", 409);
  }

  const maxPosition = await db
    .select({ max: sql<number>`coalesce(max(${linkGroupsTable.position}), -1)` })
    .from(linkGroupsTable)
    .where(eq(linkGroupsTable.userId, user.id));

  const [created] = await db
    .insert(linkGroupsTable)
    .values({
      position: (maxPosition[0]?.max ?? -1) + 1,
      slug,
      title,
      userId: user.id,
    })
    .returning();

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return serviceSuccess(toGroupResponse(created));
}

export async function updateGroup(
  user: ApiKeyUser,
  id: string,
  input: UpdateGroupInput,
): Promise<ServiceResult<GroupMutationResponse>> {
  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const [existing] = await db
    .select()
    .from(linkGroupsTable)
    .where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)))
    .limit(1);

  if (existing == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Group not found.", 404);
  }

  if (existing.isQuickLinks) {
    return serviceError(API_ERROR_CODES.FORBIDDEN, "Quick Links group cannot be modified.", 403);
  }

  const { slug: customSlug, title } = input;
  const updates: Record<string, unknown> = {};

  if (title !== undefined) {
    updates.title = title;
  }

  if (customSlug !== undefined && customSlug.length > 0) {
    const slug = customSlug.toLowerCase();
    if (slug !== existing.slug && !(await isSlugAvailable(user.id, slug, { groupId: id }))) {
      return serviceError(API_ERROR_CODES.PATH_ALREADY_IN_USE, "This path is already in use.", 409);
    }
    updates.slug = slug;
  }

  if (Object.keys(updates).length === 0) {
    return serviceSuccess(toGroupResponse(existing));
  }

  const [updated] = await db
    .update(linkGroupsTable)
    .set(updates)
    .where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)))
    .returning();

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return serviceSuccess(toGroupResponse(updated));
}

export async function deleteGroup(user: ApiKeyUser, id: string): Promise<ServiceResult<null>> {
  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const [group] = await db
    .select({ id: linkGroupsTable.id, isQuickLinks: linkGroupsTable.isQuickLinks })
    .from(linkGroupsTable)
    .where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)))
    .limit(1);

  if (group == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Group not found.", 404);
  }

  if (group.isQuickLinks) {
    return serviceError(API_ERROR_CODES.FORBIDDEN, "Quick Links group cannot be deleted.", 403);
  }

  // Ungroup links before deleting the group
  await db
    .update(linksTable)
    .set({ groupId: null })
    .where(and(eq(linksTable.groupId, id), eq(linksTable.userId, user.id)));

  await db.delete(linkGroupsTable).where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)));

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return serviceSuccess(null);
}

export async function toggleGroupVisibility(
  user: ApiKeyUser,
  id: string,
): Promise<ServiceResult<{ id: string; visible: boolean }>> {
  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const [updated] = await db
    .update(linkGroupsTable)
    .set({ visible: not(linkGroupsTable.visible) })
    .where(and(eq(linkGroupsTable.id, id), eq(linkGroupsTable.userId, user.id)))
    .returning({ id: linkGroupsTable.id, visible: linkGroupsTable.visible });

  if (updated == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Group not found.", 404);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return serviceSuccess({ id: updated.id, visible: updated.visible });
}

export type ReorderItem = { id: string; position: number };

export async function reorderGroups(user: ApiKeyUser, items: ReorderItem[]): Promise<ServiceResult<null>> {
  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const ids = items.map((item) => item.id);

  const owned = await db
    .select({ id: linkGroupsTable.id })
    .from(linkGroupsTable)
    .where(and(inArray(linkGroupsTable.id, ids), eq(linkGroupsTable.userId, user.id)));

  if (owned.length !== ids.length) {
    return serviceError(API_ERROR_CODES.FORBIDDEN, "One or more groups not found.", 403);
  }

  const sqlChunks = [sql`CASE`];
  for (const item of items) {
    sqlChunks.push(sql`WHEN ${linkGroupsTable.id} = ${item.id} THEN ${item.position}`);
  }
  sqlChunks.push(sql`ELSE ${linkGroupsTable.position} END`);

  await db
    .update(linkGroupsTable)
    .set({ position: sql.join(sqlChunks, sql` `) })
    .where(and(inArray(linkGroupsTable.id, ids), eq(linkGroupsTable.userId, user.id)));

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return serviceSuccess(null);
}
