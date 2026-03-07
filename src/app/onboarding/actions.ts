"use server";

import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
import { usernameSchema } from "@/lib/schemas/username";
import { auth } from "@clerk/nextjs/server";
import { and, eq, ne } from "drizzle-orm";

export type CheckUsernameResult = {
  available: boolean;
};

export async function checkUsernameAvailability(username: string): Promise<CheckUsernameResult> {
  const { userId } = await auth();

  if (!userId) {
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

  if (!userId) {
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
      onboardingComplete: true,
      updatedAt: new Date(),
      username: result.data,
    })
    .where(eq(usersTable.id, userId));

  return { success: true };
}
