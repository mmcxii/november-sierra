import { teamDayPushRecipients, type TeamDayEvent, type TeamDayMember } from "@/lib/challenge/team-day";
import { db } from "@/lib/db/client";
import { pushSubscriptionsTable } from "@/lib/db/schema";
import { configureWebPush, sendPushNotification } from "@/lib/push/send-push-notification";
import { teamDayPushCopy } from "@/lib/push/team-day-copy";
import { eq, inArray } from "drizzle-orm";
import type { TFunction } from "i18next";

export async function notifyTeamDay(args: {
  actorId: string;
  actorName: string;
  date: string;
  endDate: string;
  event: Exclude<TeamDayEvent, "none">;
  members: readonly TeamDayMember[];
  startDate: string;
  t: TFunction;
  teamId: string;
}): Promise<void> {
  const vapid = configureWebPush();
  if (!vapid.ok) {
    return;
  }

  const recipients = teamDayPushRecipients({ actorId: args.actorId, members: args.members });
  const userIds = recipients.map((member) => member.userId).filter((id): id is string => id != null);
  if (userIds.length === 0) {
    return;
  }

  const subscriptions = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(inArray(pushSubscriptionsTable.userId, userIds));

  if (subscriptions.length === 0) {
    return;
  }

  const copy = teamDayPushCopy({
    actorName: args.actorName,
    date: args.date,
    endDate: args.endDate,
    event: args.event,
    startDate: args.startDate,
    t: args.t,
  });

  for (const sub of subscriptions) {
    const result = await sendPushNotification(
      { auth: sub.auth, endpoint: sub.endpoint, p256dh: sub.p256dh },
      {
        body: copy.body,
        title: copy.title,
        url: `/teams/${args.teamId}`,
      },
    );
    if (!result.ok && (result.statusCode === 404 || result.statusCode === 410)) {
      await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, sub.id));
    }
  }
}
