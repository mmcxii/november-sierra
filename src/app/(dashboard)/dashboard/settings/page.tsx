import { SettingsContent } from "@/components/dashboard/settings-content";
import { requireUser } from "@/lib/auth";
import { initTranslations } from "@/lib/i18n/server";
import { type ThemeId, isValidThemeId } from "@/lib/themes";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Settings",
};

const SettingsPage: React.FC = async () => {
  const user = await requireUser();
  const { t } = await initTranslations();
  const themeId: ThemeId = isValidThemeId(user.theme) ? user.theme : "dark-depths";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("settings")}</h1>
      <SettingsContent currentThemeId={themeId} user={user} />
    </div>
  );
};

export default SettingsPage;
