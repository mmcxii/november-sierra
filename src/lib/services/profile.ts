import type { ApiKeyUser } from "@/lib/api/auth";
import { API_ERROR_CODES } from "@/lib/api/errors";
import { db } from "@/lib/db/client";
import { clicksTable } from "@/lib/db/schema/click";
import { linksTable } from "@/lib/db/schema/link";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { usersTable } from "@/lib/db/schema/user";
import { envSchema } from "@/lib/env";
import { isValidThemeId } from "@/lib/themes";
import type { Tier } from "@/lib/tier";
import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { serviceError, serviceSuccess, type ServiceResult } from "./types";

export type ProfileResponse = {
  avatarUrl: null | string;
  bio: null | string;
  createdAt: string;
  customDomain: null | string;
  displayName: null | string;
  groupCount: number;
  linkCount: number;
  pageDarkTheme: null | string;
  pageLightTheme: null | string;
  profileUrl: string;
  tier: Tier;
  totalClicks: number;
  username: string;
};

export type ProfileMutationResponse = {
  avatarUrl: null | string;
  bio: null | string;
  displayName: null | string;
  pageDarkTheme: null | string;
  pageLightTheme: null | string;
  username: string;
};

export async function getProfile(user: ApiKeyUser): Promise<ServiceResult<ProfileResponse>> {
  const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);

  if (dbUser == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "User not found.", 404);
  }

  const [[linkResult], [groupResult], [clickResult]] = await Promise.all([
    db.select({ count: count() }).from(linksTable).where(eq(linksTable.userId, user.id)),
    db.select({ count: count() }).from(linkGroupsTable).where(eq(linkGroupsTable.userId, user.id)),
    db.select({ count: count() }).from(clicksTable).where(eq(clicksTable.userId, user.id)),
  ]);

  const baseUrl = envSchema.NEXT_PUBLIC_APP_URL;

  return serviceSuccess({
    avatarUrl: dbUser.avatarUrl,
    bio: dbUser.bio,
    createdAt: dbUser.createdAt.toISOString(),
    customDomain: dbUser.customDomain,
    displayName: dbUser.displayName,
    groupCount: groupResult?.count ?? 0,
    linkCount: linkResult?.count ?? 0,
    pageDarkTheme: dbUser.pageDarkTheme,
    pageLightTheme: dbUser.pageLightTheme,
    profileUrl:
      dbUser.customDomain != null && dbUser.customDomainVerified
        ? `https://${dbUser.customDomain}`
        : `${baseUrl}/${dbUser.username}`,
    tier: user.tier,
    totalClicks: clickResult?.count ?? 0,
    username: dbUser.username,
  });
}

export type UpdateProfileInput = {
  bio?: string;
  displayName?: string;
};

export async function updateProfile(
  user: ApiKeyUser,
  input: UpdateProfileInput,
): Promise<ServiceResult<ProfileMutationResponse>> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (input.displayName !== undefined) {
    updates.displayName = input.displayName.trim().length > 0 ? input.displayName.trim() : null;
  }

  if (input.bio !== undefined) {
    updates.bio = input.bio.trim().length > 0 ? input.bio.trim() : null;
  }

  if (Object.keys(updates).length <= 1) {
    return serviceError(API_ERROR_CODES.VALIDATION_ERROR, "No fields to update.", 400);
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id)).returning({
    avatarUrl: usersTable.avatarUrl,
    bio: usersTable.bio,
    displayName: usersTable.displayName,
    pageDarkTheme: usersTable.pageDarkTheme,
    pageLightTheme: usersTable.pageLightTheme,
    username: usersTable.username,
  });

  if (updated == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "User not found.", 404);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${updated.username}`);

  return serviceSuccess({
    avatarUrl: updated.avatarUrl,
    bio: updated.bio,
    displayName: updated.displayName,
    pageDarkTheme: updated.pageDarkTheme,
    pageLightTheme: updated.pageLightTheme,
    username: updated.username,
  });
}

export type UpdateThemeInput = {
  pageDarkTheme?: string;
  pageLightTheme?: string;
};

export async function updateTheme(
  user: ApiKeyUser,
  input: UpdateThemeInput,
): Promise<ServiceResult<ProfileMutationResponse>> {
  if (input.pageDarkTheme != null && !isValidThemeId(input.pageDarkTheme)) {
    return serviceError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid dark theme ID.", 400);
  }

  if (input.pageLightTheme != null && !isValidThemeId(input.pageLightTheme)) {
    return serviceError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid light theme ID.", 400);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (input.pageDarkTheme !== undefined) {
    updates.pageDarkTheme = input.pageDarkTheme;
  }

  if (input.pageLightTheme !== undefined) {
    updates.pageLightTheme = input.pageLightTheme;
  }

  if (Object.keys(updates).length <= 1) {
    return serviceError(API_ERROR_CODES.VALIDATION_ERROR, "No fields to update.", 400);
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id)).returning({
    avatarUrl: usersTable.avatarUrl,
    bio: usersTable.bio,
    displayName: usersTable.displayName,
    pageDarkTheme: usersTable.pageDarkTheme,
    pageLightTheme: usersTable.pageLightTheme,
    username: usersTable.username,
  });

  if (updated == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "User not found.", 404);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${updated.username}`);

  return serviceSuccess({
    avatarUrl: updated.avatarUrl,
    bio: updated.bio,
    displayName: updated.displayName,
    pageDarkTheme: updated.pageDarkTheme,
    pageLightTheme: updated.pageLightTheme,
    username: updated.username,
  });
}
