import {
  isDayComplete,
  isReminderDue,
  localDateString,
  remainingTaskIds,
  tasksForMode,
  type ChallengeMode,
  type MemberStatus,
} from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { dayCompletionsTable, membersTable, pushSubscriptionsTable, taskChecksTable } from "@/lib/db/schema";
import { envSchema } from "@/lib/env";
import { initTranslations } from "@/lib/i18n/server";
import { eq } from "drizzle-orm";
import webpush from "web-push";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!envSchema.CRON_SECRET || auth !== `Bearer ${envSchema.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!envSchema.VAPID_PUBLIC_KEY || !envSchema.VAPID_PRIVATE_KEY) {
    return Response.json({ reason: "missing vapid keys", skipped: true });
  }

  webpush.setVapidDetails(envSchema.VAPID_SUBJECT, envSchema.VAPID_PUBLIC_KEY, envSchema.VAPID_PRIVATE_KEY);

  const { t } = await initTranslations();
  const now = new Date();
  const members = await db.select().from(membersTable).where(eq(membersTable.reminderEnabled, true));
  const subscriptions = await db.select().from(pushSubscriptionsTable);

  let sent = 0;

  for (const member of members) {
    const todayLocal = localDateString(now, member.timeZone);
    const days = await db.select().from(dayCompletionsTable).where(eq(dayCompletionsTable.memberId, member.id));
    const today = days.find((row) => row.date === todayLocal);
    const checkedTaskIds =
      today != null
        ? (await db.select().from(taskChecksTable).where(eq(taskChecksTable.dayCompletionId, today.id))).map(
            (row) => row.taskId,
          )
        : [];

    const mode = member.mode as ChallengeMode;
    const todayIncomplete = !isDayComplete(mode, checkedTaskIds);
    const due = isReminderDue({
      lastReminderDate: member.lastReminderDate,
      now,
      reminderEnabled: member.reminderEnabled,
      reminderTime: member.reminderTime,
      status: member.status as MemberStatus,
      timeZone: member.timeZone,
      todayIncomplete,
    });

    if (!due) {
      continue;
    }

    const remaining = remainingTaskIds(mode, checkedTaskIds)
      .map((id) => {
        const task = tasksForMode(mode).find((item) => item.id === id);
        return task != null ? t(task.labelKey) : id;
      })
      .join(", ");

    const memberSubs = subscriptions.filter((sub) => sub.memberId === member.id);
    for (const sub of memberSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { auth: sub.auth, p256dh: sub.p256dh },
          },
          JSON.stringify({
            body: t("stillOpen{{tasks}}", { tasks: remaining }),
            title: t("seventyFive"),
          }),
        );
        sent += 1;
      } catch {
        // Drop dead subscriptions silently in v0.1
      }
    }

    await db
      .update(membersTable)
      .set({ lastReminderDate: todayLocal, updatedAt: new Date() })
      .where(eq(membersTable.id, member.id));
  }

  return Response.json({ ok: true, sent });
}
