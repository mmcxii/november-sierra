"use server";

import { getAuthUser, getMembershipContext } from "@/lib/auth/session";
import { convertHardMemberToSoft, exitHardChallenge, refreshMemberStatus } from "@/lib/challenge/status";
import { hasStartPassed, localDateString, type ChallengeMode, type MemberStatus } from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { membersTable, pushSubscriptionsTable } from "@/lib/db/schema";
import { initTranslations } from "@/lib/i18n/server";
import { processDailyReminders } from "@/lib/push/process-daily-reminders";
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

/** Runs the same due-reminder path as cron for the signed-in user, without consuming the daily stamp. */
export async function sendDueReminderAction() {
  const user = await getAuthUser();
  if (user == null) {
    return { error: "somethingWentWrong" as const };
  }

  const { t } = await initTranslations();
  // Ignore wall-clock gate so settings can verify the real countdown/daily payload path.
  const result = await processDailyReminders({
    ignoreReminderTime: true,
    stampLastReminderDate: false,
    t,
    userId: user.id,
  });

  if (result.skipped) {
    return { error: "pushNotificationsAreNotConfigured" as const };
  }

  if (result.dueMembers === 0) {
    return { error: "noReminderIsDueYet" as const };
  }

  if (result.sent === 0) {
    if (result.dueWithoutSubscription > 0) {
      return { error: "couldNotEnablePushNotifications" as const };
    }
    return { error: "couldNotSendTestNotification" as const };
  }

  return { ok: true as const, sent: result.sent };
}

const resolveHardFailSchema = z.object({
  choice: z.enum(["exit", "fix", "soft"]),
  teamId: z.string().min(1),
});

export async function resolveHardFailAction(input: z.infer<typeof resolveHardFailSchema>) {
  const parsed = resolveHardFailSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" as const };
  }

  const session = await getMembershipContext(parsed.data.teamId);
  if (session == null) {
    return { error: "somethingWentWrong" as const };
  }

  const mode = session.member.mode as ChallengeMode;
  const currentStatus = session.member.status as MemberStatus;
  if (mode !== "hard" || currentStatus === "exited") {
    return { error: "somethingWentWrong" as const };
  }

  const refreshed = await refreshMemberStatus({
    endDate: session.team.endDate,
    memberId: session.member.id,
    mode,
    startDate: session.team.startDate,
    status: currentStatus,
    timeZone: session.user.timeZone,
  });

  if (refreshed.status !== "failed") {
    revalidatePath(`/teams/${parsed.data.teamId}`);
    return { ok: true as const };
  }

  if (parsed.data.choice === "fix") {
    revalidatePath(`/teams/${parsed.data.teamId}`);
    return { incompleteDate: refreshed.firstIncompletePastDate ?? null, ok: true as const };
  }

  if (parsed.data.choice === "soft") {
    await convertHardMemberToSoft({
      endDate: session.team.endDate,
      memberId: session.member.id,
      startDate: session.team.startDate,
      timeZone: session.user.timeZone,
    });
    revalidatePath(`/teams/${parsed.data.teamId}`);
    revalidatePath(`/teams/${parsed.data.teamId}/settings`);
    return { ok: true as const };
  }

  await exitHardChallenge(session.member.id);
  revalidatePath(`/teams/${parsed.data.teamId}`);
  revalidatePath(`/teams/${parsed.data.teamId}/settings`);
  return { ok: true as const };
}
