import { auth as betterAuth } from "@/lib/better-auth/server";
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

// Shim matching Clerk's `auth()` shape so the ~25 call sites of `auth()` /
// `getCurrentUser()` keep their existing `{ userId }` contract.
//
// Resolution order:
//   1. If a Better Auth session cookie is present and resolves to a user,
//      that's the authoritative identity. The user opted into BA explicitly
//      by signing in at /better-auth/sign-in (no other entrypoint exists).
//   2. Otherwise fall back to Clerk's userId.
//
// Net effect during the Shot 1 bake window: Clerk users see Clerk; BA users
// (the migrated set + anyone who chooses to sign in via /better-auth/*) see
// BA. The existence of a `users` row is the real gate on dashboard access —
// `requireUser()` redirects when no row matches the resolved id.
export async function auth(): Promise<{ userId: null | string }> {
  const session = await betterAuth.api.getSession({ headers: await headers() });
  if (session?.user.id != null) {
    return { userId: session.user.id };
  }
  const clerkUserId = (await clerkAuth()).userId;
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
