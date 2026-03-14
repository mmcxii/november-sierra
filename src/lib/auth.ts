import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
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

  return user;
}
