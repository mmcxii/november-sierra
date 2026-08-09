import type { TranslationKey } from "@/lib/i18n/i18next";

export type ChallengeMode = "hard" | "soft";

export type TaskDefinition = {
  id: string;
  labelKey: TranslationKey;
};

/**
 * App-level challenge presets. Soft criteria can change here without DB migrations.
 */
export const HARD_TASKS: readonly TaskDefinition[] = [
  { id: "workout", labelKey: "workout45Min" },
  { id: "outdoorWorkout", labelKey: "outdoorWorkout45Min" },
  { id: "water", labelKey: "drink1GallonOfWater" },
  { id: "diet", labelKey: "followDietNoAlcoholOrCheatMeals" },
  { id: "reading", labelKey: "read10PagesOfANonfictionBook" },
  { id: "progressPhoto", labelKey: "takeProgressPhoto" },
] as const;

export const SOFT_TASKS: readonly TaskDefinition[] = [
  { id: "workout", labelKey: "45MinExercise" },
  { id: "diet", labelKey: "nutritiousMealsNoAlcoholUnlessSocial" },
  { id: "water", labelKey: "drink3LitersOfWater" },
  { id: "reading", labelKey: "read10Pages" },
] as const;

export function tasksForMode(mode: ChallengeMode): readonly TaskDefinition[] {
  return mode === "hard" ? HARD_TASKS : SOFT_TASKS;
}

export function taskIdsForMode(mode: ChallengeMode): readonly string[] {
  return tasksForMode(mode).map((task) => task.id);
}

/** Inclusive 75-day window: start + 74 days. */
export function endDateFromStart(startDate: string): string {
  const date = parseDateOnly(startDate);
  date.setUTCDate(date.getUTCDate() + 74);
  return formatDateOnly(date);
}

export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match == null) {
    throw new Error(`Invalid date: ${value}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Calendar date in an IANA timezone. */
export function localDateString(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error(`Unable to format local date for ${timeZone}`);
  }

  return `${year}-${month}-${day}`;
}

export function compareDateOnly(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

export function isJoinAllowed(startDate: string, utcToday: string): boolean {
  return compareDateOnly(utcToday, startDate) < 0;
}

export function hasStartPassed(startDate: string, utcToday: string): boolean {
  return compareDateOnly(utcToday, startDate) >= 0;
}

export type DayCompletionInput = {
  checkedTaskIds: readonly string[];
  date: string;
  mode: ChallengeMode;
};

export type MemberStatus = "active" | "failed";

export type RecomputeStatusInput = {
  challengeDates: readonly string[];
  completions: readonly DayCompletionInput[];
  mode: ChallengeMode;
  todayLocal: string;
};

export function isDayComplete(mode: ChallengeMode, checkedTaskIds: readonly string[]): boolean {
  const required = taskIdsForMode(mode);
  const checked = new Set(checkedTaskIds);
  return required.every((id) => checked.has(id));
}

export function remainingTaskIds(mode: ChallengeMode, checkedTaskIds: readonly string[]): string[] {
  const checked = new Set(checkedTaskIds);
  return taskIdsForMode(mode).filter((id) => !checked.has(id));
}

/**
 * Hard: any past incomplete challenge day ⇒ failed.
 * Soft: always active (stumble is derived separately).
 */
export function recomputeMemberStatus(input: RecomputeStatusInput): MemberStatus {
  if (input.mode === "soft") {
    return "active";
  }

  const byDate = new Map(input.completions.map((completion) => [completion.date, completion]));

  for (const date of input.challengeDates) {
    if (compareDateOnly(date, input.todayLocal) >= 0) {
      continue;
    }
    const completion = byDate.get(date);
    const checked = completion?.checkedTaskIds ?? [];
    if (!isDayComplete("hard", checked)) {
      return "failed";
    }
  }

  return "active";
}

/** Soft stumble: any past challenge day incomplete. */
export function hasSoftStumble(input: Omit<RecomputeStatusInput, "mode">): boolean {
  const byDate = new Map(input.completions.map((completion) => [completion.date, completion]));

  for (const date of input.challengeDates) {
    if (compareDateOnly(date, input.todayLocal) >= 0) {
      continue;
    }
    const completion = byDate.get(date);
    const checked = completion?.checkedTaskIds ?? [];
    if (!isDayComplete("soft", checked)) {
      return true;
    }
  }

  return false;
}

export function listChallengeDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let cursor = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  while (cursor.getTime() <= end.getTime()) {
    dates.push(formatDateOnly(cursor));
    cursor = new Date(cursor);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function canEditDay(args: {
  mode: ChallengeMode;
  selectedDate: string;
  startDate: string;
  status: MemberStatus;
  todayLocal: string;
}): boolean {
  const { mode, selectedDate, startDate, status, todayLocal } = args;

  if (compareDateOnly(selectedDate, startDate) < 0) {
    return false;
  }
  if (compareDateOnly(selectedDate, todayLocal) > 0) {
    return false;
  }
  if (mode === "hard" && status === "failed" && selectedDate === todayLocal) {
    return false;
  }
  return true;
}

/** Local HH:mm in member TZ. */
export function localTimeHm(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone,
  }).formatToParts(now);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function isReminderDue(args: {
  lastReminderDate: null | string;
  now: Date;
  reminderEnabled: boolean;
  reminderTime: string;
  status: MemberStatus;
  timeZone: string;
  todayIncomplete: boolean;
}): boolean {
  const { lastReminderDate, now, reminderEnabled, reminderTime, status, timeZone, todayIncomplete } = args;

  if (!reminderEnabled || !todayIncomplete || status === "failed") {
    return false;
  }

  const todayLocal = localDateString(now, timeZone);
  if (lastReminderDate === todayLocal) {
    return false;
  }

  const currentHm = localTimeHm(now, timeZone);
  return currentHm >= reminderTime;
}
