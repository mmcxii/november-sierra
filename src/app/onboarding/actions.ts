"use server";

import { db } from "@/lib/db/client";
import { generateUniqueSlug } from "@/lib/db/queries/link";
import { linksTable } from "@/lib/db/schema/link";
import { usersTable } from "@/lib/db/schema/user";
import { detectPlatform } from "@/lib/platforms";
import { linkSchema } from "@/lib/schemas/link";
import { usernameSchema } from "@/lib/schemas/username";
import { auth } from "@clerk/nextjs/server";
import { and, eq, ne, sql } from "drizzle-orm";

export type CheckUsernameResult = {
  available: boolean;
};

export async function checkUsernameAvailability(username: string): Promise<CheckUsernameResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { available: false };
  }

  const result = usernameSchema.shape.username.safeParse(username);

  if (!result.success) {
    return { available: false };
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.username, result.data), ne(usersTable.id, userId)))
    .limit(1);

  return { available: existing.length === 0 };
}

export type UpdateUsernameErrorKey = "somethingWentWrongPleaseTryAgain" | "thisUsernameIsAlreadyTaken";

export type UpdateUsernameResult = {
  error?: UpdateUsernameErrorKey;
  success: boolean;
};

export async function updateUsername(username: string): Promise<UpdateUsernameResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const result = usernameSchema.shape.username.safeParse(username);

  if (!result.success) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.username, result.data), ne(usersTable.id, userId)))
    .limit(1);

  if (existing.length > 0) {
    return { error: "thisUsernameIsAlreadyTaken", success: false };
  }

  await db
    .update(usersTable)
    .set({
      updatedAt: new Date(),
      username: result.data,
    })
    .where(eq(usersTable.id, userId));

  return { success: true };
}

export type AddLinkResult = {
  error?: string;
  success: boolean;
};

export async function addFirstLink(title: string, url: string): Promise<AddLinkResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const result = linkSchema.safeParse({ title, url });

  if (!result.success) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const slug = await generateUniqueSlug(userId, result.data.url);

  const maxPosition = await db
    .select({ max: sql<number>`coalesce(max(${linksTable.position}), -1)` })
    .from(linksTable)
    .where(eq(linksTable.userId, userId));

  const platform = detectPlatform(result.data.url);

  await db.insert(linksTable).values({
    platform,
    position: (maxPosition[0]?.max ?? -1) + 1,
    slug,
    title: result.data.title,
    url: result.data.url,
    userId,
  });

  return { success: true };
}

export async function completeOnboarding(): Promise<{ success: boolean }> {
  const { userId } = await auth();

  if (userId == null) {
    return { success: false };
  }

  await db.update(usersTable).set({ onboardingComplete: true, updatedAt: new Date() }).where(eq(usersTable.id, userId));

  return { success: true };
}
