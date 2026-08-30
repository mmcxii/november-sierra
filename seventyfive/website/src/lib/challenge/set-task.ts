import type { MembershipContext } from "@/lib/auth/session";
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
import { after } from "next/server";

export type SetTaskCheckedInput = {
  checked: boolean;
  date: string;
  taskId: string;
};

export type SetTaskCheckedResult =
  | { error: "somethingWentWrong" | "thisDayIsReadOnly" }
  | { ok: true; teamCelebration: boolean };

export async function setTaskCheckedForMembership(
  session: MembershipContext,
  input: SetTaskCheckedInput,
): Promise<SetTaskCheckedResult> {
  const mode = session.member.mode as ChallengeMode;
  const todayLocal = localDateString(new Date(), session.user.timeZone);
  const allowed = canEditDay({
    mode,
    selectedDate: input.date,
    startDate: session.team.startDate,
    status: session.member.status as MemberStatus,
    todayLocal,
  });

  if (!allowed) {
    return { error: "thisDayIsReadOnly" };
  }

  const requiredContext = {
    date: input.date,
    endDate: session.team.endDate,
    progressPhotoEndsOnly: session.member.progressPhotoEndsOnly,
    startDate: session.team.startDate,
  };
  const requiredTaskIds = taskIdsForDay(mode, requiredContext);
  if (!requiredTaskIds.includes(input.taskId)) {
    return { error: "somethingWentWrong" };
  }

  let [day] = await db
    .select()
    .from(dayCompletionsTable)
    .where(and(eq(dayCompletionsTable.memberId, session.member.id), eq(dayCompletionsTable.date, input.date)))
    .limit(1);

  if (!day) {
    day = {
      createdAt: new Date(),
      date: input.date,
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
    return check.taskId === input.taskId;
  });

  const actorWasAlreadyComplete = isMemberCompleteForDate({
    checkedTaskIds: beforeIds,
    date: input.date,
    endDate: session.team.endDate,
    mode,
    progressPhotoEndsOnly: session.member.progressPhotoEndsOnly,
    startDate: session.team.startDate,
  });

  if (input.checked && existing == null) {
    await db.insert(taskChecksTable).values({
      dayCompletionId: day.id,
      id: newId(),
      taskId: input.taskId,
    });
  }

  if (!input.checked && existing != null) {
    await db.delete(taskChecksTable).where(eq(taskChecksTable.id, existing.id));
  }

  let afterIds = beforeIds;
  if (input.checked && existing == null) {
    afterIds = [...beforeIds, input.taskId];
  } else if (!input.checked) {
    afterIds = beforeIds.filter((id) => {
      return id !== input.taskId;
    });
  }
  const actorIsNowComplete = isMemberCompleteForDate({
    checkedTaskIds: afterIds,
    date: input.date,
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
  const shouldNotify = input.checked && input.date === todayLocal;
  const membersPromise = shouldNotify
    ? loadTeamDayMembers({
        date: input.date,
        endDate: session.team.endDate,
        startDate: session.team.startDate,
        teamId: session.team.id,
      })
    : null;
  if (membersPromise != null) {
    const members = await membersPromise;
    const event = resolveTeamDayEvent({
      actorId: session.member.id,
      actorIsNowComplete,
      actorWasAlreadyComplete,
      date: input.date,
      endDate: session.team.endDate,
      members,
      startDate: session.team.startDate,
    });
    if (event === "teamComplete") {
      teamCelebration = true;
      await stampTeamCelebrationDate(session.member.id, input.date);
    }
    if (event !== "none") {
      const { t } = await initTranslations();
      after(() => {
        return notifyTeamDay({
          actorId: session.member.id,
          actorName: session.user.name,
          date: input.date,
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
  return { ok: true, teamCelebration };
}
