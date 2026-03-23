import { db } from "@/lib/db/client";
import { referralCodesTable } from "@/lib/db/schema/referral-code";
import { usersTable } from "@/lib/db/schema/user";
import { usernameSchema } from "@/lib/schemas/username";
import { and, eq, gt, isNull, ne, or } from "drizzle-orm";

export async function isUsernameReservedByCode(username: string): Promise<boolean> {
  const [reserved] = await db
    .select({ id: referralCodesTable.id })
    .from(referralCodesTable)
    .where(
      and(
        eq(referralCodesTable.reservedUsername, username),
        eq(referralCodesTable.active, true),
        or(isNull(referralCodesTable.expiresAt), gt(referralCodesTable.expiresAt, new Date())),
      ),
    )
    .limit(1);

  return reserved != null;
}

export type CheckUsernameResult = {
  available: boolean;
};

export async function checkUsernameAvailability(userId: string, username: string): Promise<CheckUsernameResult> {
  const result = usernameSchema.shape.username.safeParse(username);

  if (!result.success) {
    return { available: false };
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.username, result.data), ne(usersTable.id, userId)))
    .limit(1);

  if (existing.length > 0) {
    return { available: false };
  }

  if (await isUsernameReservedByCode(result.data)) {
    return { available: false };
  }

  return { available: true };
}

export type UpdateUsernameResult =
  | { error: "somethingWentWrongPleaseTryAgain" | "thisUsernameIsAlreadyTaken"; success: false }
  | { oldUsername: null | string; success: true };

export async function updateUsername(userId: string, username: string): Promise<UpdateUsernameResult> {
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

  if (await isUsernameReservedByCode(result.data)) {
    return { error: "thisUsernameIsAlreadyTaken", success: false };
  }

  const [currentUser] = await db
    .select({ username: usersTable.username })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  const oldUsername = currentUser?.username ?? null;

  await db.update(usersTable).set({ updatedAt: new Date(), username: result.data }).where(eq(usersTable.id, userId));

  return { oldUsername, success: true };
}
