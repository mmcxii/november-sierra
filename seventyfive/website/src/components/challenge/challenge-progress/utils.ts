import { CHALLENGE_DAY_COUNT, type ChallengeProgressSlice } from "@/lib/challenge/progress";

export const SLICE_CLASS: Record<ChallengeProgressSlice, string> = {
  complete: "bg-sf-accent",
  failed: "bg-sf-danger",
  future: "bg-transparent",
  missed: "bg-sf-muted/55",
  pending: "bg-transparent",
};

/** Calendar frontier 0–1 for ember growth. */
export function emberProgress(elapsedDayCount: number, totalDays = CHALLENGE_DAY_COUNT): number {
  if (totalDays <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, elapsedDayCount / totalDays));
}

/** Discrete 0–10 growth step for CSS `data-level`. */
export function emberLevel(progress: number): number {
  return Math.min(10, Math.max(0, Math.round(progress * 10)));
}

/** Leading-edge day index 0–75 for CSS `data-day`. */
export function emberDay(elapsedDayCount: number, isPreStart: boolean): number {
  if (isPreStart) {
    return 0;
  }
  return Math.min(CHALLENGE_DAY_COUNT, Math.max(0, elapsedDayCount));
}
