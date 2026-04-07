import { ThemeOverviewContent } from "@/components/dashboard/theme-overview-content";
import { requireUser } from "@/lib/auth";
import { getCustomThemesByUserId } from "@/lib/db/queries/custom-theme";
import { initTranslations } from "@/lib/i18n/server";
import { type ThemeId, isValidThemeId } from "@/lib/themes";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Theme",
};

const ThemePage: React.FC = async () => {
  const user = await requireUser();
  const { t } = await initTranslations();
  const customThemes = await getCustomThemesByUserId(user.id);
  const pageDarkThemeId: ThemeId = isValidThemeId(user.pageDarkTheme) ? user.pageDarkTheme : "dark-depths";
  const pageLightThemeId: ThemeId = isValidThemeId(user.pageLightTheme) ? user.pageLightTheme : "stateroom";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("theme")}</h1>
      <ThemeOverviewContent
        customThemes={customThemes}
        pageDarkEnabled={user.pageDarkEnabled}
        pageDarkThemeId={pageDarkThemeId}
        pageLightEnabled={user.pageLightEnabled}
        pageLightThemeId={pageLightThemeId}
        user={user}
      />
    </div>
  );
};

export default ThemePage;
