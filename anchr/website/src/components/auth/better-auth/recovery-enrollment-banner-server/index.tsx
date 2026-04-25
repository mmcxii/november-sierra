import { RecoveryEnrollmentBanner } from "@/components/auth/better-auth/recovery-enrollment-banner";
import { dismissRecoveryEnrollmentBannerAction } from "@/components/auth/better-auth/recovery-enrollment-banner/actions";
import { RECOVERY_ENROLLMENT_ALERT_ID } from "@/components/auth/better-auth/recovery-enrollment-banner/constants";
import { getAlertDismissedAt } from "@/lib/better-auth/alert-dismissals";
import { countUnusedRecoveryCodes } from "@/lib/better-auth/recovery-codes";
import { auth as betterAuth } from "@/lib/better-auth/server";
import { headers } from "next/headers";
import * as React from "react";

// Server wrapper that resolves the current BA session, checks whether the user
// has any recovery codes enrolled, reads the dismissal timestamp from
// preferences.alertDismissals, and hands the client banner the state it needs
// to decide render / hide / re-nudge. Returning null skips rendering entirely
// when there's no BA user (Clerk-only users) or the user is already enrolled.
//
// This banner doubles as the post-sign-up enrollment surface. ANC-149 spec
// called for server-side auto-generation on email verification, but auto-
// generated codes that the user never sees provide zero practical Flow A
// protection (the user can't redeem a code they don't have). Generating at
// the moment the user is ready to save them — via this banner — is both
// security-equivalent and gives the user an explicit consent step before
// the plaintext is shown.
export const RecoveryEnrollmentBannerServer: React.FC = async () => {
  const session = await betterAuth.api.getSession({ headers: await headers() });
  if (session?.user.id == null) {
    return null;
  }

  const unused = await countUnusedRecoveryCodes(session.user.id);
  if (unused > 0) {
    return null;
  }

  const dismissedAt = await getAlertDismissedAt(session.user.id, RECOVERY_ENROLLMENT_ALERT_ID);

  return <RecoveryEnrollmentBanner dismissedAt={dismissedAt} onDismissed={dismissRecoveryEnrollmentBannerAction} />;
};
