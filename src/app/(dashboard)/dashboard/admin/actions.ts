"use server";

import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { referralCodesTable } from "@/lib/db/schema/referral-code";
import { generateReferralCode } from "@/lib/utils/referral-code";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type AdminActionResult = { error: string; success: false } | { success: true };

async function requireAdmin(): Promise<string> {
  const { userId } = await auth();

  if (userId == null || !isAdmin(userId)) {
    throw new Error("Unauthorized");
  }

  return userId;
}

export async function createAdminCode(input: {
  durationDays?: null | number;
  expiresAt?: null | string;
  maxRedemptions?: null | number;
  note?: null | string;
}): Promise<AdminActionResult> {
  const userId = await requireAdmin();

  const code = generateReferralCode("ANCHR");

  await db.insert(referralCodesTable).values({
    code,
    creatorId: userId,
    durationDays: input.durationDays ?? null,
    expiresAt: input.expiresAt != null ? new Date(input.expiresAt) : null,
    maxRedemptions: input.maxRedemptions ?? null,
    note: input.note ?? null,
    type: "admin",
  });

  revalidatePath("/dashboard/admin");

  return { success: true };
}

export async function deactivateAdminCode(codeId: string): Promise<AdminActionResult> {
  await requireAdmin();

  await db.update(referralCodesTable).set({ active: false }).where(eq(referralCodesTable.id, codeId));

  revalidatePath("/dashboard/admin");

  return { success: true };
}

export async function reactivateAdminCode(codeId: string): Promise<AdminActionResult> {
  await requireAdmin();

  await db.update(referralCodesTable).set({ active: true }).where(eq(referralCodesTable.id, codeId));

  revalidatePath("/dashboard/admin");

  return { success: true };
}
