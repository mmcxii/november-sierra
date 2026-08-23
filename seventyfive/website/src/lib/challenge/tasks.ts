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
  { id: "diet", labelKey: "nutritiousMeals" },
  { id: "alcohol", labelKey: "noAlcohol" },
  { id: "water", labelKey: "drink3LitersOfWater" },
  { id: "reading", labelKey: "read10Pages" },
] as const;

export const PROGRESS_PHOTO_TASK_ID = "progressPhoto";

export function tasksForMode(mode: ChallengeMode): readonly TaskDefinition[] {
  return mode === "hard" ? HARD_TASKS : SOFT_TASKS;
}

export function taskIdsForMode(mode: ChallengeMode): readonly string[] {
  return tasksForMode(mode).map((task) => task.id);
}

export type RequiredTasksContext = {
  date: string;
  endDate: string;
  progressPhotoEndsOnly?: boolean;
  startDate: string;
};

export function isProgressPhotoRequired(args: {
  date: string;
  endDate: string;
  mode: ChallengeMode;
  progressPhotoEndsOnly?: boolean;
  startDate: string;
}): boolean {
  if (args.mode !== "hard") {
    return false;
  }
  if (args.progressPhotoEndsOnly !== true) {
    return true;
  }
  return args.date === args.startDate || args.date === args.endDate;
}

export function tasksForDay(mode: ChallengeMode, context?: RequiredTasksContext): readonly TaskDefinition[] {
  const tasks = tasksForMode(mode);
  if (context == null || isProgressPhotoRequired({ mode, ...context })) {
    return tasks;
  }
  return tasks.filter((task) => {
    return task.id !== PROGRESS_PHOTO_TASK_ID;
  });
}

export function taskIdsForDay(mode: ChallengeMode, context?: RequiredTasksContext): readonly string[] {
  return tasksForDay(mode, context).map((task) => {
    return task.id;
  });
}

function requiredTasksContextForDate(
  challengeDates: readonly string[],
  date: string,
  progressPhotoEndsOnly?: boolean,
): undefined | RequiredTasksContext {
  const startDate = challengeDates[0];
  const endDate = challengeDates[challengeDates.length - 1];
  if (startDate == null || endDate == null) {
    return undefined;
  }
  return { date, endDate, progressPhotoEndsOnly, startDate };
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

/** Add whole calendar days to a YYYY-MM-DD value (timezone-agnostic date arithmetic). */
export function addDaysDateOnly(dateOnly: string, days: number): string {
  const date = parseDateOnly(dateOnly);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateOnly(date);
}

/** Earliest selectable start date and a sensible default (tomorrow) in an IANA zone. */
export function startDateBoundsForTimeZone(timeZone: string, now = new Date()) {
  const min = localDateString(now, timeZone);
  return {
    defaultValue: addDaysDateOnly(min, 1),
    min,
  };
}

export function compareDateOnly(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

/** Join is open through day 1 (the start date); locked from day 2 on. `today` is the member's local calendar date. */
export function isJoinAllowed(startDate: string, today: string): boolean {
  return compareDateOnly(today, startDate) <= 0;
}

/** True once the local calendar day is on or after the start date. */
export function hasStartPassed(startDate: string, today: string): boolean {
  return compareDateOnly(today, startDate) >= 0;
}

/** True when the start date is strictly before today (today is still allowed). */
export function isStartDateInPast(startDate: string, today: string): boolean {
  return compareDateOnly(today, startDate) > 0;
}

/** True when `startDate` is today or later in the member's IANA timezone. */
export function isStartDateSelectable(startDate: string, now: Date, timeZone: string): boolean {
  return !isStartDateInPast(startDate, localDateString(now, timeZone));
}

/** Whole days from today until start (0 when started or start is today). */
export function daysUntilStart(startDate: string, today: string): number {
  const ms = parseDateOnly(startDate).getTime() - parseDateOnly(today).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

const PRE_START_PULSE_MAX_MS = 30_000;
const PRE_START_PULSE_TOMORROW_MS = 1200;
const PRE_START_PULSE_SPAN_DAYS = 30;

/**
 * Interval between pre-start roster icon pulses (fade itself stays a fixed quick animation).
 * ~1s per day out (capped at 30s for ≥30 days) → 1.2s the day before;
 * `null` once started (daysUntil === 0).
 */
export function preStartRosterPulseMs(daysUntil: number): null | number {
  if (daysUntil <= 0) {
    return null;
  }
  if (daysUntil === 1) {
    return PRE_START_PULSE_TOMORROW_MS;
  }
  if (daysUntil >= PRE_START_PULSE_SPAN_DAYS) {
    return PRE_START_PULSE_MAX_MS;
  }
  return daysUntil * 1000;
}

export type DayCompletionInput = {
  checkedTaskIds: readonly string[];
  date: string;
  mode: ChallengeMode;
};

export type MemberStatus = "active" | "exited" | "failed";

export type RecomputeStatusInput = {
  challengeDates: readonly string[];
  completions: readonly DayCompletionInput[];
  mode: ChallengeMode;
  progressPhotoEndsOnly?: boolean;
  todayLocal: string;
};

export function isDayComplete(
  mode: ChallengeMode,
  checkedTaskIds: readonly string[],
  context?: RequiredTasksContext,
): boolean {
  const required = taskIdsForDay(mode, context);
  const checked = new Set(checkedTaskIds);
  return required.every((id) => checked.has(id));
}

export function remainingTaskIds(
  mode: ChallengeMode,
  checkedTaskIds: readonly string[],
  context?: RequiredTasksContext,
): string[] {
  const checked = new Set(checkedTaskIds);
  return taskIdsForDay(mode, context).filter((id) => !checked.has(id));
}

/**
 * Hard: any past incomplete challenge day ⇒ failed (until they choose Soft or exit).
 * Soft and exited: always active / sticky exited (handled by caller).
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
    const context = requiredTasksContextForDate(input.challengeDates, date, input.progressPhotoEndsOnly);
    if (!isDayComplete("hard", checked, context)) {
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

/** Count of past challenge days complete under Hard rules (used when converting to Soft). */
export function countCompletedHardDays(input: Omit<RecomputeStatusInput, "mode">): number {
  const byDate = new Map(input.completions.map((completion) => [completion.date, completion]));
  let completed = 0;

  for (const date of input.challengeDates) {
    if (compareDateOnly(date, input.todayLocal) >= 0) {
      continue;
    }
    const completion = byDate.get(date);
    const checked = completion?.checkedTaskIds ?? [];
    const context = requiredTasksContextForDate(input.challengeDates, date, input.progressPhotoEndsOnly);
    if (isDayComplete("hard", checked, context)) {
      completed += 1;
    }
  }

  return completed;
}

/** First past challenge day that is incomplete for the member's current mode. */
export function firstIncompletePastDate(input: RecomputeStatusInput): null | string {
  const byDate = new Map(input.completions.map((completion) => [completion.date, completion]));

  for (const date of input.challengeDates) {
    if (compareDateOnly(date, input.todayLocal) >= 0) {
      continue;
    }
    const completion = byDate.get(date);
    const checked = completion?.checkedTaskIds ?? [];
    const context = requiredTasksContextForDate(input.challengeDates, date, input.progressPhotoEndsOnly);
    if (!isDayComplete(input.mode, checked, context)) {
      return date;
    }
  }

  return null;
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
  if (status === "exited") {
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

/** Normalize stored reminder times (`HH:mm` or `HH:mm:ss`) for lexicographic compare with `localTimeHm`. */
export function normalizeReminderTime(value: string): string {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  return match == null ? value : `${match[1]}:${match[2]}`;
}

export type DailyReminder =
  | {
      daysUntil: number;
      type: "countdown";
    }
  | {
      type: "incomplete";
    };

/**
 * Daily push at the member's reminder time:
 * - before start: countdown copy once per local day
 * - on/after start: incomplete-task nudge (skipped when failed or complete)
 */
export function resolveDailyReminder(args: {
  lastReminderDate: null | string;
  now: Date;
  reminderEnabled: boolean;
  reminderTime: string;
  startDate: string;
  status: MemberStatus;
  timeZone: string;
  todayIncomplete: boolean;
}): null | DailyReminder {
  const { lastReminderDate, now, reminderEnabled, reminderTime, startDate, status, timeZone, todayIncomplete } = args;

  if (!reminderEnabled) {
    return null;
  }

  const todayLocal = localDateString(now, timeZone);
  if (lastReminderDate === todayLocal) {
    return null;
  }

  if (localTimeHm(now, timeZone) < normalizeReminderTime(reminderTime)) {
    return null;
  }

  const daysUntil = daysUntilStart(startDate, todayLocal);
  if (daysUntil > 0) {
    return { daysUntil, type: "countdown" };
  }

  if (status === "failed" || status === "exited" || !todayIncomplete) {
    return null;
  }

  return { type: "incomplete" };
}

export function isReminderDue(args: {
  lastReminderDate: null | string;
  now: Date;
  reminderEnabled: boolean;
  reminderTime: string;
  startDate: string;
  status: MemberStatus;
  timeZone: string;
  todayIncomplete: boolean;
}): boolean {
  return resolveDailyReminder(args) != null;
}
