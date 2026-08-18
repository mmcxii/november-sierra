"use server";

import { getAuthUser, getMembershipContext } from "@/lib/auth/session";
import { convertHardMemberToSoft, exitHardChallenge, refreshMemberStatus } from "@/lib/challenge/status";
import { hasStartPassed, localDateString, type ChallengeMode, type MemberStatus } from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { membersTable, pushSubscriptionsTable } from "@/lib/db/schema";
import { initTranslations } from "@/lib/i18n/server";
import { processDailyReminders } from "@/lib/push/process-daily-reminders";
import { configureWebPush, sendPushNotification } from "@/lib/push/send-push-notification";
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

export async function sendTestPushAction() {
  const user = await getAuthUser();
  if (user == null) {
    return { error: "somethingWentWrong" as const };
  }

  const vapid = configureWebPush();
  if (!vapid.ok) {
    return { error: "pushNotificationsAreNotConfigured" as const };
  }

  const subscriptions = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.userId, user.id));

  if (subscriptions.length === 0) {
    return { error: "couldNotSendTestNotification" as const };
  }

  const { t } = await initTranslations();
  let sent = 0;

  for (const sub of subscriptions) {
    const result = await sendPushNotification(
      { auth: sub.auth, endpoint: sub.endpoint, p256dh: sub.p256dh },
      {
        body: t("thisIsATestReminderFromTeamSeventyfive"),
        title: t("testNotification"),
        url: "/teams",
      },
    );

    if (result.ok) {
      sent += 1;
      continue;
    }

    if (result.statusCode === 404 || result.statusCode === 410) {
      await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, sub.id));
    }
  }

  if (sent === 0) {
    return { error: "couldNotSendTestNotification" as const };
  }

  return { ok: true as const, sent };
}

/** Runs the same due-reminder path as cron for the signed-in user. */
export async function sendDueReminderAction() {
  const user = await getAuthUser();
  if (user == null) {
    return { error: "somethingWentWrong" as const };
  }

  const { t } = await initTranslations();
  // Ignore wall-clock gate so settings can verify the real countdown/daily payload path.
  // Still respects lastReminderDate dedupe for the local day.
  const result = await processDailyReminders({ ignoreReminderTime: true, t, userId: user.id });

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
