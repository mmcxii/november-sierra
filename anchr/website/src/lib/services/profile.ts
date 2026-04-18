import type { ApiKeyUser } from "@/lib/api/auth";
import { API_ERROR_CODES } from "@/lib/api/errors";
import { db } from "@/lib/db/client";
import { getCustomThemeById } from "@/lib/db/queries/custom-theme";
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
  pageDarkEnabled: boolean;
  pageDarkTheme: null | string;
  pageLightEnabled: boolean;
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
  pageDarkEnabled: boolean;
  pageDarkTheme: null | string;
  pageLightEnabled: boolean;
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
    pageDarkEnabled: dbUser.pageDarkEnabled,
    pageDarkTheme: dbUser.pageDarkTheme,
    pageLightEnabled: dbUser.pageLightEnabled,
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
    pageDarkEnabled: usersTable.pageDarkEnabled,
    pageDarkTheme: usersTable.pageDarkTheme,
    pageLightEnabled: usersTable.pageLightEnabled,
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
    pageDarkEnabled: updated.pageDarkEnabled,
    pageDarkTheme: updated.pageDarkTheme,
    pageLightEnabled: updated.pageLightEnabled,
    pageLightTheme: updated.pageLightTheme,
    username: updated.username,
  });
}

export type UpdateThemeInput = {
  pageDarkTheme?: null | string;
  pageLightTheme?: null | string;
};

export async function updateTheme(
  user: ApiKeyUser,
  input: UpdateThemeInput,
): Promise<ServiceResult<ProfileMutationResponse>> {
  const darkProvided = input.pageDarkTheme !== undefined;
  const lightProvided = input.pageLightTheme !== undefined;

  if (!darkProvided && !lightProvided) {
    return serviceError(API_ERROR_CODES.VALIDATION_ERROR, "No fields to update.", 400);
  }

  // Validate each provided slot: preset ID, a custom theme owned by the caller, or null (disable).
  if (darkProvided && input.pageDarkTheme != null) {
    const valid = await isAssignableThemeId(user.id, input.pageDarkTheme);
    if (!valid) {
      return serviceError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid dark theme ID.", 400);
    }
  }

  if (lightProvided && input.pageLightTheme != null) {
    const valid = await isAssignableThemeId(user.id, input.pageLightTheme);
    if (!valid) {
      return serviceError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid light theme ID.", 400);
    }
  }

  const [existing] = await db
    .select({ pageDarkEnabled: usersTable.pageDarkEnabled, pageLightEnabled: usersTable.pageLightEnabled })
    .from(usersTable)
    .where(eq(usersTable.id, user.id))
    .limit(1);

  if (existing == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "User not found.", 404);
  }

  // Compute the post-update enabled state so we can enforce the "at least one enabled" invariant.
  const nextDarkEnabled = darkProvided ? input.pageDarkTheme !== null : existing.pageDarkEnabled;
  const nextLightEnabled = lightProvided ? input.pageLightTheme !== null : existing.pageLightEnabled;

  if (!nextDarkEnabled && !nextLightEnabled) {
    return serviceError(API_ERROR_CODES.VALIDATION_ERROR, "At least one theme slot must remain enabled.", 400);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (darkProvided) {
    if (input.pageDarkTheme == null) {
      updates.pageDarkEnabled = false;
    } else {
      updates.pageDarkEnabled = true;
      updates.pageDarkTheme = input.pageDarkTheme;
    }
  }

  if (lightProvided) {
    if (input.pageLightTheme == null) {
      updates.pageLightEnabled = false;
    } else {
      updates.pageLightEnabled = true;
      updates.pageLightTheme = input.pageLightTheme;
    }
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id)).returning({
    avatarUrl: usersTable.avatarUrl,
    bio: usersTable.bio,
    displayName: usersTable.displayName,
    pageDarkEnabled: usersTable.pageDarkEnabled,
    pageDarkTheme: usersTable.pageDarkTheme,
    pageLightEnabled: usersTable.pageLightEnabled,
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
    pageDarkEnabled: updated.pageDarkEnabled,
    pageDarkTheme: updated.pageDarkTheme,
    pageLightEnabled: updated.pageLightEnabled,
    pageLightTheme: updated.pageLightTheme,
    username: updated.username,
  });
}

async function isAssignableThemeId(userId: string, themeId: string): Promise<boolean> {
  if (isValidThemeId(themeId)) {
    return true;
  }
  const custom = await getCustomThemeById(themeId, userId);
  return custom != null;
}
