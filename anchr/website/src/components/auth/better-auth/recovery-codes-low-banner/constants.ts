// Threshold (inclusive) at which we surface the "running low" banner. Picked
// to give the user comfortable margin: with 3 or fewer codes, a single bad
// week of email outages could exhaust them. Below this they should regenerate.
export const RECOVERY_CODES_LOW_THRESHOLD = 3;

// alertDismissals key for the low-codes nudge. Distinct from the enrollment
// banner's id so dismissing one doesn't suppress the other.
export const RECOVERY_CODES_LOW_ALERT_ID = "recovery-codes-low";

// Re-nudge after this many days if the user dismissed without regenerating.
// Tighter than the enrollment banner because by the time this banner shows
// the user is already at risk of a lockout.
export const RECOVERY_CODES_LOW_RENUDGE_DAYS = 3;

// Date.now() is impure under React Compiler so the renudge check can't live
// inside a server component body. Factor it into a top-level helper.
export function isLowCodesNudgeSuppressed(dismissedAt: null | Date): boolean {
  if (dismissedAt == null) {
    return false;
  }
  const elapsedMs = Date.now() - dismissedAt.getTime();
  const renudgeAfterMs = RECOVERY_CODES_LOW_RENUDGE_DAYS * 24 * 60 * 60 * 1000;
  return elapsedMs < renudgeAfterMs;
}
