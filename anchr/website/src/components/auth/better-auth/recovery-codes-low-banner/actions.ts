"use server";

import { dismissAlertForUser } from "@/lib/better-auth/alert-dismissals";
import { auth as betterAuth } from "@/lib/better-auth/server";
import { headers } from "next/headers";
import { RECOVERY_CODES_LOW_ALERT_ID } from "./constants";

export async function dismissRecoveryCodesLowBannerAction(): Promise<{ ok: boolean }> {
  const session = await betterAuth.api.getSession({ headers: await headers() });
  if (session?.user.id == null) {
    return { ok: false };
  }
  await dismissAlertForUser(session.user.id, RECOVERY_CODES_LOW_ALERT_ID);
  return { ok: true };
}
