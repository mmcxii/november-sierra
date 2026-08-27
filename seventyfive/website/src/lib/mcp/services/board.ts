import { getMembershipContextForUser } from "@/lib/auth/session";
import { challengeDayNumber } from "@/lib/challenge/celebrations";
import { buildChallengeProgressSlices, countMissedSlices, elapsedProgressForMember } from "@/lib/challenge/progress";
import {
  canEditDay,
  daysUntilStart,
  hasSoftStumble,
  isDayComplete,
  listChallengeDates,
  localDateString,
  remainingTaskIds,
  tasksForDay,
  type ChallengeMode,
  type MemberStatus,
} from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { betterAuthUserTable, dayCompletionsTable, membersTable, taskChecksTable } from "@/lib/db/schema";
import { english } from "@/lib/mcp/english";
import { serviceError, serviceSuccess, type McpUser, type ServiceResult } from "@/lib/mcp/types";
import { eq, inArray } from "drizzle-orm";

export type BoardTask = {
  checked: boolean;
  id: string;
  label: string;
};

export type BoardRosterMember = {
  complete: boolean;
  displayName: string;
  isSelf: boolean;
  mode: ChallengeMode;
  offTrack: boolean;
  remaining: string[];
  status: MemberStatus;
};

export type BoardProgress = {
  completedDays: number;
  currentDay: null | number;
  daysUntilStart: number;
  missedDays: number;
  offTrack: boolean;
  todayComplete: boolean;
};

export type BoardSnapshot = {
  date: string;
  editable: boolean;
  me: {
    mode: ChallengeMode;
    remaining: string[];
    status: MemberStatus;
    tasks: BoardTask[];
  };
  progress: BoardProgress;
  roster: BoardRosterMember[];
  team: {
    endDate: string;
    id: string;
    name: string;
    startDate: string;
  };
  todayLocal: string;
};

export async function getBoard(
  user: McpUser,
  input: { date?: string; teamId: string },
): Promise<ServiceResult<BoardSnapshot>> {
  const session = await getMembershipContextForUser(user.id, input.teamId);
  if (session == null) {
    return serviceError("NOT_FOUND", "You are not a member of that team.");
  }

  const todayLocal = localDateString(new Date(), session.user.timeZone);
  const selectedDate = input.date ?? todayLocal;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    return serviceError("INVALID_DATE", "date must be YYYY-MM-DD.");
  }

  const memberMode = session.member.mode as ChallengeMode;
  const memberStatus = session.member.status as MemberStatus;
  const challengeDates = listChallengeDates(session.team.startDate, session.team.endDate);

  const members = await db
    .select({
      member: membersTable,
      user: betterAuthUserTable,
    })
    .from(membersTable)
    .leftJoin(betterAuthUserTable, eq(membersTable.userId, betterAuthUserTable.id))
    .where(eq(membersTable.teamId, session.team.id));

  const memberIds = members.map((row) => row.member.id);
  const allMemberDays =
    memberIds.length === 0
      ? []
      : await db.select().from(dayCompletionsTable).where(inArray(dayCompletionsTable.memberId, memberIds));

  const dayIds = allMemberDays.map((day) => day.id);
  const checks =
    dayIds.length === 0
      ? []
      : await db.select().from(taskChecksTable).where(inArray(taskChecksTable.dayCompletionId, dayIds));

  const checksByDay = new Map<string, string[]>();
  for (const check of checks) {
    const list = checksByDay.get(check.dayCompletionId) ?? [];
    list.push(check.taskId);
    checksByDay.set(check.dayCompletionId, list);
  }

  const daysByMember = new Map<string, typeof allMemberDays>();
  for (const day of allMemberDays) {
    const list = daysByMember.get(day.memberId) ?? [];
    list.push(day);
    daysByMember.set(day.memberId, list);
  }

  const selfCompletions = (daysByMember.get(session.member.id) ?? []).map((day) => {
    return {
      checkedTaskIds: checksByDay.get(day.id) ?? [],
      date: day.date,
      mode: memberMode,
    };
  });
  const selfDay = allMemberDays.find((day) => day.memberId === session.member.id && day.date === selectedDate);
  const selfChecked = selfDay != null ? (checksByDay.get(selfDay.id) ?? []) : [];
  const taskContext = {
    date: selectedDate,
    endDate: session.team.endDate,
    progressPhotoEndsOnly: session.member.progressPhotoEndsOnly,
    startDate: session.team.startDate,
  };
  const tasks = tasksForDay(memberMode, taskContext).map((task) => {
    return {
      checked: selfChecked.includes(task.id),
      id: task.id,
      label: english(task.labelKey),
    };
  });
  const remaining = remainingTaskIds(memberMode, selfChecked, taskContext).map((taskId) => {
    const task = tasks.find((item) => item.id === taskId);
    return task?.label ?? taskId;
  });

  const selfProgress = elapsedProgressForMember({
    completions: selfCompletions,
    endDate: session.team.endDate,
    mode: memberMode,
    progressPhotoEndsOnly: session.member.progressPhotoEndsOnly,
    startDate: session.team.startDate,
    todayLocal,
  });
  const slices = buildChallengeProgressSlices({
    elapsedComplete: selfProgress.elapsedComplete,
    lastElapsedIsToday: selfProgress.lastElapsedIsToday,
    mode: memberMode,
    status: memberStatus,
  });
  const offTrack =
    memberMode === "soft" &&
    hasSoftStumble({
      challengeDates,
      completions: selfCompletions,
      todayLocal,
    });
  const daysUntil = daysUntilStart(session.team.startDate, todayLocal);

  const roster: BoardRosterMember[] = members.map((row) => {
    const mode = row.member.mode as ChallengeMode;
    const status = (row.member.id === session.member.id ? memberStatus : row.member.status) as MemberStatus;
    const selectedDay = allMemberDays.find((day) => day.memberId === row.member.id && day.date === selectedDate);
    const checkedTaskIds = selectedDay != null ? (checksByDay.get(selectedDay.id) ?? []) : [];
    const context = {
      date: selectedDate,
      endDate: session.team.endDate,
      progressPhotoEndsOnly: row.member.progressPhotoEndsOnly,
      startDate: session.team.startDate,
    };
    const completions = (daysByMember.get(row.member.id) ?? []).map((day) => ({
      checkedTaskIds: checksByDay.get(day.id) ?? [],
      date: day.date,
      mode,
    }));
    const memberOffTrack =
      mode === "soft" &&
      hasSoftStumble({
        challengeDates,
        completions,
        todayLocal,
      });
    const remainingLabels = remainingTaskIds(mode, checkedTaskIds, context).map((taskId) => {
      const definition = tasksForDay(mode, context).find((task) => task.id === taskId);
      return definition != null ? english(definition.labelKey) : taskId;
    });

    return {
      complete: isDayComplete(mode, checkedTaskIds, context),
      displayName: row.user?.name ?? row.member.displayName,
      isSelf: row.member.id === session.member.id,
      mode,
      offTrack: memberOffTrack,
      remaining: remainingLabels,
      status,
    };
  });

  return serviceSuccess({
    date: selectedDate,
    editable: canEditDay({
      mode: memberMode,
      selectedDate,
      startDate: session.team.startDate,
      status: memberStatus,
      todayLocal,
    }),
    me: {
      mode: memberMode,
      remaining,
      status: memberStatus,
      tasks,
    },
    progress: {
      completedDays: slices.filter((slice) => slice === "complete").length,
      currentDay: daysUntil === 0 ? challengeDayNumber(session.team.startDate, todayLocal) : null,
      daysUntilStart: daysUntil,
      missedDays: countMissedSlices(slices),
      offTrack,
      todayComplete: selfProgress.lastElapsedIsToday && selfProgress.elapsedComplete.at(-1) === true,
    },
    roster,
    team: {
      endDate: session.team.endDate,
      id: session.team.id,
      name: session.team.name,
      startDate: session.team.startDate,
    },
    todayLocal,
  });
}
