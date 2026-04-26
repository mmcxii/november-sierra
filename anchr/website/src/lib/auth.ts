import { auth as betterAuth } from "@/lib/better-auth/server";
import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
import { envSchema } from "@/lib/env";
import { cleanupExpiredPro } from "@/lib/tier.server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as React from "react";

export type SessionUser = typeof usersTable.$inferSelect;

// Thin wrapper over Better Auth that preserves the `{ userId }` contract used
// across the ~20 call sites of `auth()` / `getCurrentUser()`. After ANC-152
// (Clerk removal) this is the only auth source — there is no fallback.
export async function auth(): Promise<{ userId: null | string }> {
  const session = await betterAuth.api.getSession({ headers: await headers() });
  return { userId: session?.user.id ?? null };
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

export function isAdmin(userId: string): boolean {
  return envSchema.ADMIN_USER_ID != null && userId === envSchema.ADMIN_USER_ID;
}
