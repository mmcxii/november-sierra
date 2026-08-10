import { setPendingPasswordCookie } from "@/lib/auth/session";
import {
  USERNAME_MAX,
  generateAccountPassword,
  syntheticEmailForUsername,
  usernameBaseFromDisplayName,
} from "@/lib/auth/username";
import { auth } from "@/lib/better-auth/server";
import { db } from "@/lib/db/client";
import { betterAuthUserTable, membersTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export type CreatedAccount = {
  displayName: string;
  password: string;
  timeZone: string;
  userId: string;
  username: string;
};

async function allocateUsername(displayName: string): Promise<string> {
  const base = usernameBaseFromDisplayName(displayName);
  let candidate = base;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const [existing] = await db
      .select({ id: betterAuthUserTable.id })
      .from(betterAuthUserTable)
      .where(eq(betterAuthUserTable.username, candidate))
      .limit(1);
    if (existing == null) {
      return candidate;
    }
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    candidate = `${base.slice(0, Math.max(3, USERNAME_MAX - suffix.length))}${suffix}`;
  }
  return `${base.slice(0, 18)}${Date.now().toString(36)}`.slice(0, USERNAME_MAX);
}

export async function createAccountForDisplayName(args: {
  displayName: string;
  timeZone: string;
}): Promise<CreatedAccount> {
  const displayName = args.displayName.trim();
  const username = await allocateUsername(displayName);
  const password = generateAccountPassword();
  const email = syntheticEmailForUsername(username);

  const signedUp = await auth.api.signUpEmail({
    body: {
      email,
      name: displayName,
      password,
      timeZone: args.timeZone,
      username,
    } as never,
    headers: await headers(),
  });

  const userId = signedUp.user.id;

  await db
    .update(betterAuthUserTable)
    .set({ timeZone: args.timeZone, updatedAt: new Date() })
    .where(eq(betterAuthUserTable.id, userId));

  await setPendingPasswordCookie({ password, username });

  return {
    displayName,
    password,
    timeZone: args.timeZone,
    userId,
    username,
  };
}

export async function migrateLegacyMemberToAccount(memberId: string): Promise<null | CreatedAccount> {
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, memberId)).limit(1);
  if (member == null || member.userId != null) {
    return null;
  }

  const created = await createAccountForDisplayName({
    displayName: member.displayName,
    timeZone: member.timeZone,
  });

  await db
    .update(membersTable)
    .set({
      displayName: member.displayName,
      timeZone: member.timeZone,
      updatedAt: new Date(),
      userId: created.userId,
    })
    .where(eq(membersTable.id, member.id));

  return created;
}
