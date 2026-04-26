import { SettingsContent } from "@/components/dashboard/settings-content";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { betterAuthUserTable } from "@/lib/db/schema/better-auth";
import { initTranslations } from "@/lib/i18n/server";
import { type ThemeId, isValidThemeId } from "@/lib/themes";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Settings",
};

type SettingsPageProps = {
  searchParams: Promise<{ checkout?: string }>;
};

const SettingsPage: React.FC<SettingsPageProps> = async (props) => {
  const { searchParams } = props;
  const params = await searchParams;
  const checkoutSuccess = params.checkout === "success";
  const checkoutCancelled = params.checkout === "cancelled";

  const user = await requireUser();
  const { t } = await initTranslations();
  const pageDarkThemeId: ThemeId = isValidThemeId(user.pageDarkTheme) ? user.pageDarkTheme : "dark-depths";
  const pageLightThemeId: ThemeId = isValidThemeId(user.pageLightTheme) ? user.pageLightTheme : "stateroom";

  // Email lives on ba_user (BA owns identity post ANC-152). The application
  // `users` row is pure profile/billing/etc. data and doesn't carry email.
  const [baUser] = await db
    .select({ email: betterAuthUserTable.email })
    .from(betterAuthUserTable)
    .where(eq(betterAuthUserTable.id, user.id))
    .limit(1);
  const email = baUser?.email ?? "";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("settings")}</h1>
      <SettingsContent
        checkoutCancelled={checkoutCancelled}
        checkoutSuccess={checkoutSuccess}
        email={email}
        hideBranding={user.hideBranding}
        pageDarkThemeId={pageDarkThemeId}
        pageLightThemeId={pageLightThemeId}
        user={user}
      />
    </div>
  );
};

export default SettingsPage;
