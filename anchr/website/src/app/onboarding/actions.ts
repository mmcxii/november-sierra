"use server";

import { db } from "@/lib/db/client";
import { generateUniqueSlug } from "@/lib/db/queries/link";
import {
  checkUsernameAvailability as checkUsernameAvailabilityQuery,
  updateUsername as updateUsernameQuery,
} from "@/lib/db/queries/username";
import { linksTable } from "@/lib/db/schema/link";
import { usersTable } from "@/lib/db/schema/user";
import { detectPlatform } from "@/lib/platforms";
import { linkSchema } from "@/lib/schemas/link";
import { auth } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";

export type { CheckUsernameResult } from "@/lib/db/queries/username";

export async function checkUsernameAvailability(username: string) {
  const { userId } = await auth();

  if (userId == null) {
    return { available: false };
  }

  return checkUsernameAvailabilityQuery(userId, username);
}

export type UpdateUsernameResult = {
  error?: string;
  success: boolean;
};

export async function updateUsername(username: string): Promise<UpdateUsernameResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const result = await updateUsernameQuery(userId, username);

  if (!result.success) {
    return { error: result.error, success: false };
  }

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

export type CompleteOnboardingResult = {
  referral?: { durationDays: null | number; referrerName: null | string };
  success: boolean;
};

export async function completeOnboarding(): Promise<{ success: boolean }> {
  const { userId } = await auth();

  if (userId == null) {
    return { success: false };
  }

  await db.update(usersTable).set({ onboardingComplete: true, updatedAt: new Date() }).where(eq(usersTable.id, userId));

  return { success: true };
}
