import { addDaysDateOnly, compareDateOnly } from "@/lib/challenge/tasks";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

/** e.g. 2026-08-09 → "SUN, AUG 9" */
export function formatStepperDateLabel(dateOnly: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (match == null) {
    return dateOnly;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return `${WEEKDAYS[date.getUTCDay()]}, ${MONTHS[month - 1]} ${day}`;
}

/** Latest date the stepper may show: today, capped by challenge end. */
export function stepperMaxDate(todayLocal: string, endDate: string): string {
  return compareDateOnly(todayLocal, endDate) <= 0 ? todayLocal : endDate;
}

export function canStepDate(args: {
  direction: -1 | 1;
  endDate: string;
  selectedDate: string;
  startDate: string;
  todayLocal: string;
}): boolean {
  const next = addDaysDateOnly(args.selectedDate, args.direction);
  if (compareDateOnly(next, args.startDate) < 0) {
    return false;
  }
  const max = stepperMaxDate(args.todayLocal, args.endDate);
  if (compareDateOnly(next, max) > 0) {
    return false;
  }
  return true;
}
