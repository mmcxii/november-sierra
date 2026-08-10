"use server";

import { migrateLegacyMemberToAccount } from "@/lib/auth/account";
import { clearSessionCookie, getPendingPasswordCookie, getSessionMemberId } from "@/lib/auth/session";

export async function runLegacyMigrationAction(): Promise<null | { password: string; username: string }> {
  const memberId = await getSessionMemberId();
  if (memberId != null) {
    await migrateLegacyMemberToAccount(memberId);
    await clearSessionCookie();
  }

  return getPendingPasswordCookie();
}
