import {
  daysUntilStart,
  isDayComplete,
  localDateString,
  remainingTaskIds,
  resolveDailyReminder,
  tasksForDay,
  type ChallengeMode,
  type MemberStatus,
  type RequiredTasksContext,
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
import { configureWebPush, sendPushNotification } from "@/lib/push/send-push-notification";
import { eq } from "drizzle-orm";
import type { TFunction } from "i18next";

export type ReminderCopy = {
  body: string;
  title: string;
};

export type ProcessDailyRemindersResult = {
  dueMembers: number;
  dueWithoutDelivery: number;
  dueWithoutSubscription: number;
  enabledMembers: number;
  ok: true;
  sendFailures: Record<string, number>;
  sent: number;
  skipped: false;
};

export type ProcessDailyRemindersSkipped = {
  ok: true;
  reason: string;
  skipped: true;
};

export async function processDailyReminders(args: {
  dryRun?: boolean;
  ignoreReminderTime?: boolean;
  now?: Date;
  /** Cron stamps the local day so later hourly scans do not resend. Manual sends skip this. */
  stampLastReminderDate?: boolean;
  t: TFunction;
  userId?: string;
}): Promise<ProcessDailyRemindersResult | ProcessDailyRemindersSkipped> {
  const { dryRun = false, ignoreReminderTime = false, stampLastReminderDate = true, t, userId } = args;
  const now = args.now ?? new Date();

  const vapid = configureWebPush();
  if (!vapid.ok) {
    return { ok: true, reason: vapid.reason, skipped: true };
  }

  const membersQuery = db
    .select({
      endDate: teamsTable.endDate,
      id: membersTable.id,
      lastReminderDate: membersTable.lastReminderDate,
      mode: membersTable.mode,
      progressPhotoEndsOnly: membersTable.progressPhotoEndsOnly,
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

  const members = await membersQuery;
  const scopedMembers =
    userId == null
      ? members
      : members.filter((member) => {
          return member.userId === userId;
        });

  const subscriptions =
    userId == null
      ? await db.select().from(pushSubscriptionsTable)
      : await db.select().from(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.userId, userId));

  let sent = 0;
  let dueMembers = 0;
  let dueWithoutDelivery = 0;
  let dueWithoutSubscription = 0;
  const sendFailures: Record<string, number> = {};

  for (const member of scopedMembers) {
    if (member.userId == null) {
      continue;
    }

    const todayLocal = localDateString(now, member.timeZone);
    const mode = member.mode as ChallengeMode;
    const status = member.status as MemberStatus;
    const daysUntil = daysUntilStart(member.startDate, todayLocal);

    let checkedTaskIds: string[] = [];
    let todayIncomplete = true;
    const requiredContext: RequiredTasksContext = {
      date: todayLocal,
      endDate: member.endDate,
      progressPhotoEndsOnly: member.progressPhotoEndsOnly,
      startDate: member.startDate,
    };

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
      todayIncomplete = !isDayComplete(mode, checkedTaskIds, requiredContext);
    }

    const reminder = resolveDailyReminder({
      lastReminderDate: member.lastReminderDate,
      now,
      reminderEnabled: member.reminderEnabled,
      reminderTime: ignoreReminderTime ? "00:00" : member.reminderTime,
      startDate: member.startDate,
      status,
      timeZone: member.timeZone,
      todayIncomplete,
    });

    if (reminder == null) {
      continue;
    }

    dueMembers += 1;
    const copy = reminderCopy({ checkedTaskIds, mode, reminder, requiredContext, t });

    const memberSubs = subscriptions.filter((sub) => {
      return sub.userId === member.userId;
    });

    if (memberSubs.length === 0) {
      dueWithoutSubscription += 1;
      dueWithoutDelivery += 1;
      continue;
    }

    if (dryRun) {
      continue;
    }

    let delivered = 0;
    for (const sub of memberSubs) {
      const result = await sendPushNotification(
        { auth: sub.auth, endpoint: sub.endpoint, p256dh: sub.p256dh },
        {
          body: copy.body,
          title: copy.title,
          url: "/teams",
        },
      );

      if (result.ok) {
        delivered += 1;
        sent += 1;
        continue;
      }

      const key = result.statusCode == null ? "unknown" : String(result.statusCode);
      sendFailures[key] = (sendFailures[key] ?? 0) + 1;

      if (result.statusCode === 404 || result.statusCode === 410) {
        await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, sub.id));
      }
    }

    // Only stamp the day when at least one push was accepted. Otherwise a missing
    // or dead subscription would silently burn the reminder for the local day.
    if (delivered > 0 && stampLastReminderDate) {
      await db
        .update(membersTable)
        .set({ lastReminderDate: todayLocal, updatedAt: new Date() })
        .where(eq(membersTable.id, member.id));
    } else if (delivered === 0) {
      dueWithoutDelivery += 1;
    }
  }

  return {
    dueMembers,
    dueWithoutDelivery,
    dueWithoutSubscription,
    enabledMembers: scopedMembers.length,
    ok: true,
    sendFailures,
    sent,
    skipped: false,
  };
}

export function reminderCopy(args: {
  checkedTaskIds: string[];
  mode: ChallengeMode;
  reminder: NonNullable<ReturnType<typeof resolveDailyReminder>>;
  requiredContext?: RequiredTasksContext;
  t: TFunction;
}): ReminderCopy {
  const { checkedTaskIds, mode, reminder, requiredContext, t } = args;

  if (reminder.type === "countdown") {
    return {
      body:
        reminder.daysUntil === 1
          ? t("challengeStartsTomorrow")
          : t("challengeStartsIn{{count}}Days", { count: reminder.daysUntil }),
      title: t("countdown"),
    };
  }

  const remaining = remainingTaskIds(mode, checkedTaskIds, requiredContext)
    .map((id) => {
      const task = tasksForDay(mode, requiredContext).find((item) => {
        return item.id === id;
      });
      return task != null ? t(task.labelKey) : id;
    })
    .join(", ");

  return {
    body: t("stillOpen{{tasks}}", { tasks: remaining }),
    title: t("dailyUpdate"),
  };
}
