import { CHALLENGE_DAY_COUNT } from "@/lib/challenge/progress";
import { isDayComplete, type ChallengeMode } from "@/lib/challenge/tasks";

export type CheckCelebration = "day" | "finale" | "none";

export type ResolveCheckCelebrationInput = {
  checkedTaskIdsBefore: readonly string[];
  endDate: string;
  mode: ChallengeMode;
  nextChecked: boolean;
  selectedDate: string;
  startDate: string;
  taskId: string;
  todayLocal: string;
};

/** Day number (1–75) for a challenge date, or null if outside the window. */
export function challengeDayNumber(startDate: string, date: string): null | number {
  const startMs = Date.parse(`${startDate}T00:00:00.000Z`);
  const dateMs = Date.parse(`${date}T00:00:00.000Z`);
  if (Number.isNaN(startMs) || Number.isNaN(dateMs)) {
    return null;
  }
  const day = Math.floor((dateMs - startMs) / 86_400_000) + 1;
  if (day < 1 || day > CHALLENGE_DAY_COUNT) {
    return null;
  }
  return day;
}

/**
 * Resolve celebration after a successful check.
 * Day/finale only for completing today; uncheck and catch-up never toast.
 */
export function resolveCheckCelebration(input: ResolveCheckCelebrationInput): CheckCelebration {
  if (!input.nextChecked) {
    return "none";
  }
  if (input.selectedDate !== input.todayLocal) {
    return "none";
  }

  const nextIds = new Set(input.checkedTaskIdsBefore);
  nextIds.add(input.taskId);
  const nextList = [...nextIds];

  if (isDayComplete(input.mode, input.checkedTaskIdsBefore)) {
    return "none";
  }
  if (!isDayComplete(input.mode, nextList)) {
    return "none";
  }

  if (input.todayLocal === input.endDate) {
    return "finale";
  }

  return "day";
}

export function daysRemainingAfter(dayNumber: number): number {
  return Math.max(0, CHALLENGE_DAY_COUNT - dayNumber);
}

export function dayCelebratedStorageKey(teamId: string, todayLocal: string): string {
  return `sf-day-celebrated:${teamId}:${todayLocal}`;
}
