"use server";

import { getAuthUser, getMembershipContext } from "@/lib/auth/session";
import { hasStartPassed, localDateString, type ChallengeMode } from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { membersTable, pushSubscriptionsTable } from "@/lib/db/schema";
import { newId } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const reminderTimeSchema = z
  .string()
  .trim()
  .transform((value) => {
    const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
    return match == null ? value : `${match[1]}:${match[2]}`;
  })
  .pipe(z.string().regex(/^\d{2}:\d{2}$/));

const updateMemberSchema = z.object({
  mode: z.enum(["hard", "soft"]),
  reminderEnabled: z.boolean(),
  reminderTime: reminderTimeSchema,
  teamId: z.string().min(1),
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

  const session = await getMembershipContext(parsed.data.teamId);
  if (session == null) {
    return { error: "somethingWentWrong" as const };
  }

  const todayLocal = localDateString(new Date(), session.user.timeZone);
  const startPassed = hasStartPassed(session.team.startDate, todayLocal);
  const nextMode = startPassed ? (session.member.mode as ChallengeMode) : parsed.data.mode;

  await db
    .update(membersTable)
    .set({
      // Clear so a failed/no-subscription day can retry after the user re-saves.
      lastReminderDate: parsed.data.reminderEnabled ? null : session.member.lastReminderDate,
      mode: nextMode,
      reminderEnabled: parsed.data.reminderEnabled,
      reminderTime: parsed.data.reminderTime,
      updatedAt: new Date(),
    })
    .where(eq(membersTable.id, session.member.id));

  revalidatePath(`/teams/${parsed.data.teamId}`);
  revalidatePath(`/teams/${parsed.data.teamId}/settings`);
  return { ok: true as const };
}

export async function savePushSubscriptionAction(input: z.infer<typeof pushSchema>) {
  const parsed = pushSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" as const };
  }

  const user = await getAuthUser();
  if (user == null) {
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
        p256dh: parsed.data.p256dh,
        userId: user.id,
      })
      .where(eq(pushSubscriptionsTable.id, existing.id));
  } else {
    await db.insert(pushSubscriptionsTable).values({
      auth: parsed.data.auth,
      endpoint: parsed.data.endpoint,
      id: newId(),
      p256dh: parsed.data.p256dh,
      userId: user.id,
    });
  }

  return { ok: true as const };
}
