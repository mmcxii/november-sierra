import { BetterAuthEmailChangeForm } from "@/components/auth/better-auth/email-change-form";
import { BetterAuthRegenerateRecoveryCodesForm } from "@/components/auth/better-auth/regenerate-recovery-codes-form";
import { BetterAuthTwoFactorToggleForm } from "@/components/auth/better-auth/two-factor-toggle-form";
import { auth as betterAuth } from "@/lib/better-auth/server";
import { db } from "@/lib/db/client";
import { betterAuthUserTable } from "@/lib/db/schema/better-auth";
import { initTranslations } from "@/lib/i18n/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as React from "react";

export const metadata: Metadata = {
  title: "Account security",
};

// BA-specific account security page. Houses the three security surfaces that
// only apply to credential users: email change (with re-verification),
// 2FA toggle, and recovery code regeneration. Clerk-only sessions are
// bounced to the standard /dashboard/settings page; everything here is
// authoritative against the ba_user row, not the application users row.
const BetterAuthSettingsPage: React.FC = async () => {
  const session = await betterAuth.api.getSession({ headers: await headers() });
  if (session?.user.id == null) {
    redirect("/dashboard/settings");
  }

  const [baUser] = await db
    .select()
    .from(betterAuthUserTable)
    .where(eq(betterAuthUserTable.id, session.user.id))
    .limit(1);

  if (baUser == null) {
    redirect("/dashboard/settings");
  }

  const { t } = await initTranslations();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("accountSecurity")}</h1>
      <BetterAuthEmailChangeForm currentEmail={baUser.email} />
      <BetterAuthTwoFactorToggleForm initialEnabled={baUser.twoFactorEnabled} />
      <BetterAuthRegenerateRecoveryCodesForm />
    </div>
  );
};

export default BetterAuthSettingsPage;
