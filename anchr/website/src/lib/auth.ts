import { auth as betterAuth } from "@/lib/better-auth/server";
import { isWhitelistedForBetterAuth } from "@/lib/better-auth/whitelist";
import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
import { envSchema } from "@/lib/env";
import { cleanupExpiredPro } from "@/lib/tier.server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as React from "react";

export type SessionUser = typeof usersTable.$inferSelect;

// Shim matching Clerk's `auth()` shape. Whitelisted users resolve via Better
// Auth; everyone else stays on Clerk. Zero changes at the ~25 call sites of
// `auth()`/`getCurrentUser()` — they keep their existing `{ userId }` contract.
export async function auth(): Promise<{ userId: null | string }> {
  const clerkUserId = (await clerkAuth()).userId;
  if (isWhitelistedForBetterAuth(clerkUserId)) {
    return { userId: clerkUserId };
  }

  const session = await betterAuth.api.getSession({ headers: await headers() });
  if (session?.user.id != null && isWhitelistedForBetterAuth(session.user.id)) {
    return { userId: session.user.id };
  }

  return { userId: clerkUserId };
}

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
