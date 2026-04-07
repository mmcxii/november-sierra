import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
import { envSchema } from "@/lib/env";
import { cleanupExpiredPro } from "@/lib/tier.server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import * as React from "react";

export type SessionUser = typeof usersTable.$inferSelect;

export const getCurrentUser = React.cache(async (): Promise<null | SessionUser> => {
  const { userId } = await auth();

  if (userId == null) {
    return null;
  }

  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  return user[0] ?? null;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (user == null) {
    redirect("/sign-in");
  }

  return cleanupExpiredPro(user);
}

/**
 * Wait for the user record to appear in the DB (handles the race between
 * Clerk's `user.created` webhook and the client-side redirect to /onboarding).
 * Retries up to `maxAttempts` times with a short delay between each.
 */
export async function waitForUser(maxAttempts = 10, delayMs = 500): Promise<SessionUser> {
  const { userId } = await auth();

  if (userId == null) {
    redirect("/sign-in");
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (user != null) {
      return cleanupExpiredPro(user);
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  redirect("/sign-in");
}

export function isAdmin(userId: string): boolean {
  return envSchema.ADMIN_USER_ID != null && userId === envSchema.ADMIN_USER_ID;
}
