"use server";

import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
import { isValidThemeId } from "@/lib/themes";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type UpdateThemeResult = {
  error?: string;
  success: boolean;
};

export async function updateTheme(theme: string): Promise<UpdateThemeResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (!isValidThemeId(theme)) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db
    .update(usersTable)
    .set({ theme, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning({ username: usersTable.username });

  if (user?.username) {
    revalidatePath(`/${user.username}`);
  }

  return { success: true };
}
