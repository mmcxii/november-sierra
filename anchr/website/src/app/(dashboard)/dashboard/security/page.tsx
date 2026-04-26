import { EmailChangeForm } from "@/components/auth/email-change-form";
import { RegenerateRecoveryCodesForm } from "@/components/auth/regenerate-recovery-codes-form";
import { TwoFactorToggleForm } from "@/components/auth/two-factor-toggle-form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { betterAuthUserTable } from "@/lib/db/schema/better-auth";
import { initTranslations } from "@/lib/i18n/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import * as React from "react";

export const metadata: Metadata = {
  title: "Account security",
};

// Account security surfaces that only apply to credential users: email
// change (re-verify password → confirmation link), 2FA toggle, and
// recovery code regeneration. Authoritative against ba_user.
const SecurityPage: React.FC = async () => {
  const user = await requireUser();

  const [baUser] = await db.select().from(betterAuthUserTable).where(eq(betterAuthUserTable.id, user.id)).limit(1);

  if (baUser == null) {
    // Application user without a corresponding ba_user row should never happen
    // post-cutover (the create hook in server.ts pairs them), but if it does
    // we fall back to the regular settings page rather than render an empty
    // security console.
    redirect("/dashboard/settings");
  }

  const { t } = await initTranslations();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("accountSecurity")}</h1>
      <EmailChangeForm currentEmail={baUser.email} />
      <TwoFactorToggleForm initialEnabled={baUser.twoFactorEnabled} />
      <RegenerateRecoveryCodesForm />
    </div>
  );
};

export default SecurityPage;
