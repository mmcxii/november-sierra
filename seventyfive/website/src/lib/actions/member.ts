"use server";

import { getSessionContext } from "@/lib/auth/session";
import { hasStartPassed, formatDateOnly, type ChallengeMode } from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { membersTable, pushSubscriptionsTable } from "@/lib/db/schema";
import { newId } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateMemberSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  mode: z.enum(["hard", "soft"]),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/),
  timeZone: z.string().min(1),
});

const pushSchema = z.object({
  auth: z.string().min(1),
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
});

export async function updateMemberAction(input: z.infer<typeof updateMemberSchema>) {
  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" as const };
  }

  const session = await getSessionContext();
  if (session == null) {
    return { error: "somethingWentWrong" as const };
  }

  const utcToday = formatDateOnly(new Date());
  const startPassed = hasStartPassed(session.group.startDate, utcToday);
  const nextMode = startPassed ? (session.member.mode as ChallengeMode) : parsed.data.mode;

  await db
    .update(membersTable)
    .set({
      displayName: parsed.data.displayName,
      mode: nextMode,
      reminderEnabled: parsed.data.reminderEnabled,
      reminderTime: parsed.data.reminderTime,
      timeZone: parsed.data.timeZone,
      updatedAt: new Date(),
    })
    .where(eq(membersTable.id, session.member.id));

  revalidatePath("/group");
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function savePushSubscriptionAction(input: z.infer<typeof pushSchema>) {
  const parsed = pushSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" as const };
  }

  const session = await getSessionContext();
  if (session == null) {
    return { error: "somethingWentWrong" as const };
  }

  const [existing] = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.endpoint, parsed.data.endpoint))
    .limit(1);

  if (existing) {
    await db
      .update(pushSubscriptionsTable)
      .set({
        auth: parsed.data.auth,
        memberId: session.member.id,
        p256dh: parsed.data.p256dh,
      })
      .where(eq(pushSubscriptionsTable.id, existing.id));
  } else {
    await db.insert(pushSubscriptionsTable).values({
      auth: parsed.data.auth,
      endpoint: parsed.data.endpoint,
      id: newId(),
      memberId: session.member.id,
      p256dh: parsed.data.p256dh,
    });
  }

  return { ok: true as const };
}
