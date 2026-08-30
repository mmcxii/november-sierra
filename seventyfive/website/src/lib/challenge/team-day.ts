import { challengeDayNumber } from "@/lib/challenge/celebrations";
import {
  compareDateOnly,
  isDayComplete,
  type ChallengeMode,
  type DayCompletionInput,
  type MemberStatus,
} from "@/lib/challenge/tasks";

export type TeamDayEvent = "memberFinished" | "none" | "teamComplete";

/** Consecutive incomplete past challenge days before a member is hidden from the roster. */
export const DORMANT_INCOMPLETE_PAST_DAYS = 5;

export type TeamDayMember = {
  checkedTaskIds: readonly string[];
  dormant: boolean;
  id: string;
  mode: ChallengeMode;
  progressPhotoEndsOnly?: boolean;
  reminderEnabled: boolean;
  status: MemberStatus;
  userId: null | string;
};

export type CountedTeamMember = {
  dormant?: boolean;
  status: MemberStatus;
};

export function countsTowardTeamDay(member: CountedTeamMember): boolean {
  return member.status !== "exited" && member.dormant !== true;
}

export function countedTeamMembers<T extends CountedTeamMember>(members: readonly T[]): T[] {
  return members.filter((member) => {
    return countsTowardTeamDay(member);
  });
}

function requiredContextForDate(
  challengeDates: readonly string[],
  date: string,
  progressPhotoEndsOnly?: boolean,
): undefined | { date: string; endDate: string; progressPhotoEndsOnly?: boolean; startDate: string } {
  const startDate = challengeDates[0];
  const endDate = challengeDates[challengeDates.length - 1];
  if (startDate == null || endDate == null) {
    return undefined;
  }
  return { date, endDate, progressPhotoEndsOnly, startDate };
}

/** True when the member has no complete day in the last 5 past challenge days as of todayLocal. */
export function isDormant(input: {
  challengeDates: readonly string[];
  completions: readonly Pick<DayCompletionInput, "checkedTaskIds" | "date">[];
  mode: ChallengeMode;
  progressPhotoEndsOnly?: boolean;
  todayLocal: string;
}): boolean {
  const pastDates = input.challengeDates.filter((date) => compareDateOnly(date, input.todayLocal) < 0);
  if (pastDates.length < DORMANT_INCOMPLETE_PAST_DAYS) {
    return false;
  }

  const threshold = pastDates[pastDates.length - DORMANT_INCOMPLETE_PAST_DAYS];
  if (threshold == null) {
    return false;
  }

  const byDate = new Map(input.completions.map((completion) => [completion.date, completion.checkedTaskIds]));
  let lastComplete: null | string = null;
  for (const date of input.challengeDates) {
    if (compareDateOnly(date, input.todayLocal) > 0) {
      continue;
    }
    const checked = byDate.get(date) ?? [];
    const context = requiredContextForDate(input.challengeDates, date, input.progressPhotoEndsOnly);
    if (isDayComplete(input.mode, checked, context)) {
      lastComplete = date;
    }
  }

  return lastComplete == null || compareDateOnly(lastComplete, threshold) < 0;
}

export function isMemberCompleteForDate(args: {
  checkedTaskIds: readonly string[];
  date: string;
  endDate: string;
  mode: ChallengeMode;
  progressPhotoEndsOnly?: boolean;
  startDate: string;
}): boolean {
  return isDayComplete(args.mode, args.checkedTaskIds, {
    date: args.date,
    endDate: args.endDate,
    progressPhotoEndsOnly: args.progressPhotoEndsOnly,
    startDate: args.startDate,
  });
}

export function resolveTeamDayEvent(args: {
  actorId: string;
  actorIsNowComplete: boolean;
  actorWasAlreadyComplete: boolean;
  date: string;
  endDate: string;
  members: readonly TeamDayMember[];
  startDate: string;
}): TeamDayEvent {
  if (args.actorWasAlreadyComplete || !args.actorIsNowComplete) {
    return "none";
  }

  const counted = countedTeamMembers(args.members);
  if (counted.length < 2) {
    return "none";
  }

  const allComplete = counted.every((member) => {
    return isMemberCompleteForDate({
      checkedTaskIds: member.checkedTaskIds,
      date: args.date,
      endDate: args.endDate,
      mode: member.mode,
      progressPhotoEndsOnly: member.progressPhotoEndsOnly,
      startDate: args.startDate,
    });
  });

  if (!allComplete) {
    return "memberFinished";
  }

  const others = counted.filter((member) => {
    return member.id !== args.actorId;
  });
  return others.length >= 2 ? "none" : "teamComplete";
}

export function teamDayPushRecipients(args: { actorId: string; members: readonly TeamDayMember[] }): TeamDayMember[] {
  return countedTeamMembers(args.members).filter((member) => {
    return member.id !== args.actorId && member.reminderEnabled && member.userId != null;
  });
}

export function isDateTeamComplete(args: {
  date: string;
  endDate: string;
  members: readonly TeamDayMember[];
  startDate: string;
}): boolean {
  const counted = countedTeamMembers(args.members);
  if (counted.length < 2) {
    return false;
  }
  return counted.every((member) => {
    return isMemberCompleteForDate({
      checkedTaskIds: member.checkedTaskIds,
      date: args.date,
      endDate: args.endDate,
      mode: member.mode,
      progressPhotoEndsOnly: member.progressPhotoEndsOnly,
      startDate: args.startDate,
    });
  });
}

export type MemberDayChecks = {
  checkedTaskIds: readonly string[];
  date: string;
  memberId: string;
};

export function membersForDate(
  members: readonly Omit<TeamDayMember, "checkedTaskIds" | "dormant">[],
  completions: readonly MemberDayChecks[],
  date: string,
  challengeDates: readonly string[],
): TeamDayMember[] {
  const checksByMember = new Map<string, readonly string[]>();
  const completionsByMember = new Map<string, MemberDayChecks[]>();
  for (const row of completions) {
    const list = completionsByMember.get(row.memberId) ?? [];
    list.push(row);
    completionsByMember.set(row.memberId, list);
    if (row.date === date) {
      checksByMember.set(row.memberId, row.checkedTaskIds);
    }
  }
  return members.map((member) => {
    return {
      ...member,
      checkedTaskIds: checksByMember.get(member.id) ?? [],
      dormant: isDormant({
        challengeDates,
        completions: completionsByMember.get(member.id) ?? [],
        mode: member.mode,
        progressPhotoEndsOnly: member.progressPhotoEndsOnly,
        todayLocal: date,
      }),
    };
  });
}

/** Latest team-complete challenge date the member has not seen, among dates ≤ todayLocal. */
export function pendingTeamCelebrationDate(args: {
  challengeDates: readonly string[];
  completions: readonly MemberDayChecks[];
  endDate: string;
  lastTeamCelebrationDate: null | string;
  members: readonly Omit<TeamDayMember, "checkedTaskIds" | "dormant">[];
  startDate: string;
  todayLocal: string;
}): null | string {
  const counted = countedTeamMembers(args.members);
  if (counted.length < 2) {
    return null;
  }

  let latest: null | string = null;
  for (const date of args.challengeDates) {
    if (date > args.todayLocal) {
      continue;
    }
    if (
      !isDateTeamComplete({
        date,
        endDate: args.endDate,
        members: membersForDate(args.members, args.completions, date, args.challengeDates),
        startDate: args.startDate,
      })
    ) {
      continue;
    }
    latest = date;
  }

  if (latest == null) {
    return null;
  }
  if (args.lastTeamCelebrationDate != null && latest <= args.lastTeamCelebrationDate) {
    return null;
  }
  return latest;
}

export function teamCelebrationIsFinale(startDate: string, endDate: string, date: string): boolean {
  return date === endDate && challengeDayNumber(startDate, date) != null;
}
