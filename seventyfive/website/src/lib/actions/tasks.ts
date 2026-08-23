"use server";

import { getMembershipContext } from "@/lib/auth/session";
import { refreshMemberStatus } from "@/lib/challenge/status";
import {
  canEditDay,
  localDateString,
  taskIdsForDay,
  type ChallengeMode,
  type MemberStatus,
} from "@/lib/challenge/tasks";
import { isMemberCompleteForDate, resolveTeamDayEvent } from "@/lib/challenge/team-day";
import { loadTeamDayMembers, stampTeamCelebrationDate } from "@/lib/challenge/team-day-db";
import { db } from "@/lib/db/client";
import { dayCompletionsTable, taskChecksTable } from "@/lib/db/schema";
import { initTranslations } from "@/lib/i18n/server";
import { notifyTeamDay } from "@/lib/push/notify-team-day";
import { newId } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

const setTaskSchema = z.object({
  checked: z.boolean(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taskId: z.string().min(1),
  teamId: z.string().min(1),
});

export async function setTaskCheckedAction(input: z.infer<typeof setTaskSchema>) {
  const parsed = setTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" as const };
  }

  const session = await getMembershipContext(parsed.data.teamId);
  if (session == null) {
    return { error: "somethingWentWrong" as const };
  }

  const mode = session.member.mode as ChallengeMode;
  const todayLocal = localDateString(new Date(), session.user.timeZone);
  const allowed = canEditDay({
    mode,
    selectedDate: parsed.data.date,
    startDate: session.team.startDate,
    status: session.member.status as MemberStatus,
    todayLocal,
  });

  if (!allowed) {
    return { error: "thisDayIsReadOnly" as const };
  }

  const requiredContext = {
    date: parsed.data.date,
    endDate: session.team.endDate,
    progressPhotoEndsOnly: session.member.progressPhotoEndsOnly,
    startDate: session.team.startDate,
  };
  const requiredTaskIds = taskIdsForDay(mode, requiredContext);
  if (!requiredTaskIds.includes(parsed.data.taskId)) {
    return { error: "somethingWentWrong" as const };
  }

  let [day] = await db
    .select()
    .from(dayCompletionsTable)
    .where(and(eq(dayCompletionsTable.memberId, session.member.id), eq(dayCompletionsTable.date, parsed.data.date)))
    .limit(1);

  if (!day) {
    day = {
      createdAt: new Date(),
      date: parsed.data.date,
      id: newId(),
      memberId: session.member.id,
    };
    await db.insert(dayCompletionsTable).values(day);
  }

  const existingChecks = await db.select().from(taskChecksTable).where(eq(taskChecksTable.dayCompletionId, day.id));
  const beforeIds = existingChecks.map((check) => {
    return check.taskId;
  });
  const existing = existingChecks.find((check) => {
    return check.taskId === parsed.data.taskId;
  });

  const actorWasAlreadyComplete = isMemberCompleteForDate({
    checkedTaskIds: beforeIds,
    date: parsed.data.date,
    endDate: session.team.endDate,
    mode,
    progressPhotoEndsOnly: session.member.progressPhotoEndsOnly,
    startDate: session.team.startDate,
  });

  if (parsed.data.checked && existing == null) {
    await db.insert(taskChecksTable).values({
      dayCompletionId: day.id,
      id: newId(),
      taskId: parsed.data.taskId,
    });
  }

  if (!parsed.data.checked && existing != null) {
    await db.delete(taskChecksTable).where(eq(taskChecksTable.id, existing.id));
  }

  let afterIds = beforeIds;
  if (parsed.data.checked && existing == null) {
    afterIds = [...beforeIds, parsed.data.taskId];
  } else if (!parsed.data.checked) {
    afterIds = beforeIds.filter((id) => {
      return id !== parsed.data.taskId;
    });
  }
  const actorIsNowComplete = isMemberCompleteForDate({
    checkedTaskIds: afterIds,
    date: parsed.data.date,
    endDate: session.team.endDate,
    mode,
    progressPhotoEndsOnly: session.member.progressPhotoEndsOnly,
    startDate: session.team.startDate,
  });

  const statusPromise = refreshMemberStatus({
    endDate: session.team.endDate,
    memberId: session.member.id,
    mode,
    progressPhotoEndsOnly: session.member.progressPhotoEndsOnly,
    startDate: session.team.startDate,
    status: session.member.status as MemberStatus,
    timeZone: session.user.timeZone,
  });

  let teamCelebration = false;
  const shouldNotify = parsed.data.checked && parsed.data.date === todayLocal;
  const membersPromise = shouldNotify ? loadTeamDayMembers(session.team.id, parsed.data.date) : null;
  if (membersPromise != null) {
    const members = await membersPromise;
    const event = resolveTeamDayEvent({
      actorId: session.member.id,
      actorIsNowComplete,
      actorWasAlreadyComplete,
      date: parsed.data.date,
      endDate: session.team.endDate,
      members,
      startDate: session.team.startDate,
    });
    if (event === "teamComplete") {
      teamCelebration = true;
      await stampTeamCelebrationDate(session.member.id, parsed.data.date);
    }
    if (event !== "none") {
      const { t } = await initTranslations();
      after(() => {
        return notifyTeamDay({
          actorId: session.member.id,
          actorName: session.user.name,
          date: parsed.data.date,
          endDate: session.team.endDate,
          event,
          members,
          startDate: session.team.startDate,
          t,
          teamId: session.team.id,
        });
      });
    }
  }

  await statusPromise;
  revalidatePath(`/teams/${parsed.data.teamId}`);
  return { ok: true as const, teamCelebration };
}
