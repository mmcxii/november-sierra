import { SettingsContent } from "@/components/dashboard/settings-content";
import { requireUser } from "@/lib/auth";
import { initTranslations } from "@/lib/i18n/server";
import { type ThemeId, isValidThemeId } from "@/lib/themes";
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

  const user = await requireUser();
  const { t } = await initTranslations();
  const pageDarkThemeId: ThemeId = isValidThemeId(user.pageDarkTheme) ? user.pageDarkTheme : "dark-depths";
  const pageLightThemeId: ThemeId = isValidThemeId(user.pageLightTheme) ? user.pageLightTheme : "stateroom";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("settings")}</h1>
      <SettingsContent
        checkoutSuccess={checkoutSuccess}
        hideBranding={user.hideBranding}
        pageDarkThemeId={pageDarkThemeId}
        pageLightThemeId={pageLightThemeId}
        user={user}
      />
    </div>
  );
};

export default SettingsPage;
