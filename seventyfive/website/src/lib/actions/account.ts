"use server";

import { transferOrDeleteOwnedTeam } from "@/lib/actions/team";
import {
  clearPendingPasswordCookie,
  getAuthUser,
  listMembershipsForUser,
  setPendingPasswordCookie,
} from "@/lib/auth/session";
import { generateAccountPassword, syntheticEmailForUsername } from "@/lib/auth/username";
import { auth } from "@/lib/better-auth/server";
import { db } from "@/lib/db/client";
import { betterAuthAccountTable, betterAuthUserTable, membersTable } from "@/lib/db/schema";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

export type AccountActionResult = { error: string } | { ok: true; password?: string; username?: string };

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  timeZone: z.string().min(1),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]{3,30}$/),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function updateProfileAction(input: z.infer<typeof profileSchema>): Promise<AccountActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" };
  }

  const user = await getAuthUser();
  if (user == null) {
    return { error: "somethingWentWrong" };
  }

  if (parsed.data.username !== user.username) {
    const [taken] = await db
      .select({ id: betterAuthUserTable.id })
      .from(betterAuthUserTable)
      .where(eq(betterAuthUserTable.username, parsed.data.username))
      .limit(1);
    if (taken != null && taken.id !== user.id) {
      return { error: "usernameIsTaken" };
    }
  }

  await db
    .update(betterAuthUserTable)
    .set({
      displayUsername: parsed.data.username,
      email: syntheticEmailForUsername(parsed.data.username),
      name: parsed.data.displayName,
      timeZone: parsed.data.timeZone,
      updatedAt: new Date(),
      username: parsed.data.username,
    })
    .where(eq(betterAuthUserTable.id, user.id));

  await db
    .update(membersTable)
    .set({
      displayName: parsed.data.displayName,
      timeZone: parsed.data.timeZone,
      updatedAt: new Date(),
    })
    .where(eq(membersTable.userId, user.id));

  return { ok: true };
}

export async function changePasswordAction(input: z.infer<typeof passwordSchema>): Promise<AccountActionResult> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" };
  }

  const user = await getAuthUser();
  if (user == null) {
    return { error: "somethingWentWrong" };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch {
    return { error: "couldNotChangePassword" };
  }

  return { ok: true };
}

export async function generateNewPasswordAction(): Promise<AccountActionResult> {
  const user = await getAuthUser();
  if (user == null || user.username == null) {
    return { error: "somethingWentWrong" };
  }

  const password = generateAccountPassword();
  const hashed = await hashPassword(password);

  await db
    .update(betterAuthAccountTable)
    .set({ password: hashed, updatedAt: new Date() })
    .where(and(eq(betterAuthAccountTable.userId, user.id), eq(betterAuthAccountTable.providerId, "credential")));

  await setPendingPasswordCookie({ password, username: user.username });
  return { ok: true, password, username: user.username };
}

export async function acknowledgePasswordSavedAction(): Promise<AccountActionResult> {
  await clearPendingPasswordCookie();
  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  await clearPendingPasswordCookie();
  redirect("/");
}

const deleteAccountSchema = z.object({
  confirm: z.literal(true),
});

export async function deleteAccountAction(input: z.infer<typeof deleteAccountSchema>): Promise<AccountActionResult> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "confirmDeleteAccount" };
  }

  const user = await getAuthUser();
  if (user == null) {
    return { error: "somethingWentWrong" };
  }

  const memberships = await listMembershipsForUser(user.id);
  for (const row of memberships) {
    if (row.member.isOwner) {
      await transferOrDeleteOwnedTeam(row.team.id, row.member.id);
    }
  }

  await db.delete(betterAuthUserTable).where(eq(betterAuthUserTable.id, user.id));
  await clearPendingPasswordCookie();
  redirect("/");
}
