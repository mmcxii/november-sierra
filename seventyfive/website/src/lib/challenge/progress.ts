import {
  compareDateOnly,
  isDayComplete,
  listChallengeDates,
  type ChallengeMode,
  type DayCompletionInput,
  type MemberStatus,
} from "@/lib/challenge/tasks";

export const CHALLENGE_DAY_COUNT = 75;

export type ChallengeProgressSlice = "complete" | "failed" | "future" | "missed" | "pending";

export type BuildChallengeProgressSlicesInput = {
  elapsedComplete: readonly boolean[];
  lastElapsedIsToday: boolean;
  mode: ChallengeMode;
  status: MemberStatus;
  totalDays?: number;
};

/** One slice per challenge day (default 75). Future days stay empty track. */
export function buildChallengeProgressSlices(input: BuildChallengeProgressSlicesInput): ChallengeProgressSlice[] {
  const totalDays = input.totalDays ?? CHALLENGE_DAY_COUNT;
  const slices: ChallengeProgressSlice[] = Array.from({ length: totalDays }, () => {
    return "future";
  });
  const elapsed = Math.min(input.elapsedComplete.length, totalDays);

  if ((input.mode === "hard" && input.status === "failed") || input.status === "exited") {
    for (let index = 0; index < elapsed; index += 1) {
      slices[index] = "failed";
    }
    return slices;
  }

  for (let index = 0; index < elapsed; index += 1) {
    const complete = input.elapsedComplete[index] === true;
    if (complete) {
      slices[index] = "complete";
      continue;
    }

    const isLastElapsed = index === elapsed - 1;
    if (isLastElapsed && input.lastElapsedIsToday) {
      slices[index] = "pending";
      continue;
    }

    if (input.mode === "soft") {
      slices[index] = "missed";
      continue;
    }

    // Hard active should not have past misses; treat as complete fill.
    slices[index] = "complete";
  }

  return slices;
}

export type ElapsedProgressInput = {
  completions: readonly Pick<DayCompletionInput, "checkedTaskIds" | "date">[];
  endDate: string;
  mode: ChallengeMode;
  startDate: string;
  todayLocal: string;
};

export type ElapsedProgress = {
  elapsedComplete: boolean[];
  lastElapsedIsToday: boolean;
};

/** Completeness for each challenge day from start through min(today, end). */
export function elapsedProgressForMember(input: ElapsedProgressInput): ElapsedProgress {
  const challengeDates = listChallengeDates(input.startDate, input.endDate);
  const byDate = new Map(input.completions.map((completion) => [completion.date, completion.checkedTaskIds]));
  const elapsedDates = challengeDates.filter((date) => {
    return compareDateOnly(date, input.todayLocal) <= 0;
  });

  return {
    elapsedComplete: elapsedDates.map((date) => {
      return isDayComplete(input.mode, byDate.get(date) ?? []);
    }),
    lastElapsedIsToday: elapsedDates.at(-1) === input.todayLocal,
  };
}

export function countMissedSlices(slices: readonly ChallengeProgressSlice[]): number {
  return slices.reduce((count, slice) => {
    return slice === "missed" ? count + 1 : count;
  }, 0);
}
