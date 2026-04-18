export const INITIAL_DAYS = 21;
export const INITIAL_HOURS = 12;
export const INITIAL_MINUTES = 59;
export const INITIAL_SECONDS = 59;

export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;

export function computeInitialTotalSeconds(): number {
  return (
    INITIAL_DAYS * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE +
    INITIAL_HOURS * MINUTES_PER_HOUR * SECONDS_PER_MINUTE +
    INITIAL_MINUTES * SECONDS_PER_MINUTE +
    INITIAL_SECONDS
  );
}

export function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
