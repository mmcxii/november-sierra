import {
  daysUntilStart,
  isDayComplete,
  localDateString,
  remainingTaskIds,
  resolveDailyReminder,
  tasksForMode,
  type ChallengeMode,
  type MemberStatus,
} from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import {
  betterAuthUserTable,
  dayCompletionsTable,
  membersTable,
  pushSubscriptionsTable,
  taskChecksTable,
  teamsTable,
} from "@/lib/db/schema";
import { envSchema } from "@/lib/env";
import { initTranslations } from "@/lib/i18n/server";
import { eq } from "drizzle-orm";
import webpush from "web-push";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!envSchema.CRON_SECRET || authHeader !== `Bearer ${envSchema.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!envSchema.VAPID_PUBLIC_KEY || !envSchema.VAPID_PRIVATE_KEY) {
    return Response.json({ reason: "missing vapid keys", skipped: true });
  }

  webpush.setVapidDetails(envSchema.VAPID_SUBJECT, envSchema.VAPID_PUBLIC_KEY, envSchema.VAPID_PRIVATE_KEY);

  const { t } = await initTranslations();
  const now = new Date();
  const members = await db
    .select({
      id: membersTable.id,
      lastReminderDate: membersTable.lastReminderDate,
      mode: membersTable.mode,
      reminderEnabled: membersTable.reminderEnabled,
      reminderTime: membersTable.reminderTime,
      startDate: teamsTable.startDate,
      status: membersTable.status,
      timeZone: betterAuthUserTable.timeZone,
      userId: membersTable.userId,
    })
    .from(membersTable)
    .innerJoin(teamsTable, eq(membersTable.teamId, teamsTable.id))
    .innerJoin(betterAuthUserTable, eq(membersTable.userId, betterAuthUserTable.id))
    .where(eq(membersTable.reminderEnabled, true));
  const subscriptions = await db.select().from(pushSubscriptionsTable);

  let sent = 0;

  for (const member of members) {
    if (member.userId == null) {
      continue;
    }

    const todayLocal = localDateString(now, member.timeZone);
    const mode = member.mode as ChallengeMode;
    const status = member.status as MemberStatus;
    const daysUntil = daysUntilStart(member.startDate, todayLocal);

    let checkedTaskIds: string[] = [];
    let todayIncomplete = true;

    if (daysUntil === 0) {
      const days = await db.select().from(dayCompletionsTable).where(eq(dayCompletionsTable.memberId, member.id));
      const today = days.find((row) => {
        return row.date === todayLocal;
      });
      checkedTaskIds =
        today != null
          ? (await db.select().from(taskChecksTable).where(eq(taskChecksTable.dayCompletionId, today.id))).map(
              (row) => {
                return row.taskId;
              },
            )
          : [];
      todayIncomplete = !isDayComplete(mode, checkedTaskIds);
    }

    const reminder = resolveDailyReminder({
      lastReminderDate: member.lastReminderDate,
      now,
      reminderEnabled: member.reminderEnabled,
      reminderTime: member.reminderTime,
      startDate: member.startDate,
      status,
      timeZone: member.timeZone,
      todayIncomplete,
    });

    if (reminder == null) {
      continue;
    }

    let body: string;
    if (reminder.type === "countdown") {
      body =
        reminder.daysUntil === 1
          ? t("challengeStartsTomorrow")
          : t("challengeStartsIn{{count}}Days", { count: reminder.daysUntil });
    } else {
      const remaining = remainingTaskIds(mode, checkedTaskIds)
        .map((id) => {
          const task = tasksForMode(mode).find((item) => {
            return item.id === id;
          });
          return task != null ? t(task.labelKey) : id;
        })
        .join(", ");
      body = t("stillOpen{{tasks}}", { tasks: remaining });
    }

    const memberSubs = subscriptions.filter((sub) => {
      return sub.userId === member.userId;
    });
    for (const sub of memberSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { auth: sub.auth, p256dh: sub.p256dh },
          },
          JSON.stringify({
            body,
            title: t("seventyFive"),
            url: "/teams",
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
