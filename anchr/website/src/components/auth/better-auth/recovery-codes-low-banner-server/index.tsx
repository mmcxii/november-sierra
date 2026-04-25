import { RecoveryCodesLowBanner } from "@/components/auth/better-auth/recovery-codes-low-banner";
import { dismissRecoveryCodesLowBannerAction } from "@/components/auth/better-auth/recovery-codes-low-banner/actions";
import {
  RECOVERY_CODES_LOW_ALERT_ID,
  RECOVERY_CODES_LOW_THRESHOLD,
  isLowCodesNudgeSuppressed,
} from "@/components/auth/better-auth/recovery-codes-low-banner/constants";
import { getAlertDismissedAt } from "@/lib/better-auth/alert-dismissals";
import { countUnusedRecoveryCodes } from "@/lib/better-auth/recovery-codes";
import { auth as betterAuth } from "@/lib/better-auth/server";
import { headers } from "next/headers";
import * as React from "react";

// Server wrapper for the low-recovery-codes nudge. Renders only when the user
// has burned through most of their codes (1 ≤ unused ≤ threshold). Returns
// null in every other case: no BA session (Clerk-only user), zero codes
// (the enrollment banner takes over), plenty of codes left, or the user
// dismissed within the re-nudge window.
export const RecoveryCodesLowBannerServer: React.FC = async () => {
  const session = await betterAuth.api.getSession({ headers: await headers() });
  if (session?.user.id == null) {
    return null;
  }

  const unused = await countUnusedRecoveryCodes(session.user.id);
  if (unused === 0 || unused > RECOVERY_CODES_LOW_THRESHOLD) {
    return null;
  }

  const dismissedAt = await getAlertDismissedAt(session.user.id, RECOVERY_CODES_LOW_ALERT_ID);
  if (isLowCodesNudgeSuppressed(dismissedAt)) {
    return null;
  }

  return <RecoveryCodesLowBanner onDismissed={dismissRecoveryCodesLowBannerAction} remaining={unused} />;
};
