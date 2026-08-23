import { challengeDayNumber } from "@/lib/challenge/celebrations";
import { isDayComplete, type ChallengeMode, type MemberStatus } from "@/lib/challenge/tasks";

export type TeamDayEvent = "memberFinished" | "none" | "teamComplete";

export type TeamDayMember = {
  checkedTaskIds: readonly string[];
  id: string;
  mode: ChallengeMode;
  progressPhotoEndsOnly?: boolean;
  reminderEnabled: boolean;
  status: MemberStatus;
  userId: null | string;
};

export function countsTowardTeamDay(status: MemberStatus): boolean {
  return status !== "exited";
}

export function countedTeamMembers<T extends { status: MemberStatus }>(members: readonly T[]): T[] {
  return members.filter((member) => {
    return countsTowardTeamDay(member.status);
  });
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

  return allComplete ? "teamComplete" : "memberFinished";
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
  members: readonly Omit<TeamDayMember, "checkedTaskIds">[],
  completions: readonly MemberDayChecks[],
  date: string,
): TeamDayMember[] {
  const checksByMember = new Map<string, readonly string[]>();
  for (const row of completions) {
    if (row.date !== date) {
      continue;
    }
    checksByMember.set(row.memberId, row.checkedTaskIds);
  }
  return members.map((member) => {
    return {
      ...member,
      checkedTaskIds: checksByMember.get(member.id) ?? [],
    };
  });
}

/** Latest team-complete challenge date the member has not seen, among dates ≤ todayLocal. */
export function pendingTeamCelebrationDate(args: {
  challengeDates: readonly string[];
  completions: readonly MemberDayChecks[];
  endDate: string;
  lastTeamCelebrationDate: null | string;
  members: readonly Omit<TeamDayMember, "checkedTaskIds">[];
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
        members: membersForDate(args.members, args.completions, date),
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
