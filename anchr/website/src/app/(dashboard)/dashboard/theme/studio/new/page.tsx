import { ThemeStudioContent } from "@/components/dashboard/theme-studio-content";
import { requireUser } from "@/lib/auth";
import { PRESET_THEME_VARIABLES, type ThemeVariables } from "@/lib/custom-themes";
import { getCustomThemeById, getCustomThemesByUserId } from "@/lib/db/queries/custom-theme";
import { initTranslations } from "@/lib/i18n/server";
import { isValidThemeId } from "@/lib/themes";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "New Theme",
};

type NewThemePageProps = {
  searchParams: Promise<{ from?: string }>;
};

const NewThemePage: React.FC<NewThemePageProps> = async (props) => {
  const { searchParams } = props;
  const params = await searchParams;
  const user = await requireUser();
  const { t } = await initTranslations();

  // Determine starting variables
  let initialVariables: undefined | ThemeVariables;
  let initialName: undefined | string;

  if (params.from != null) {
    if (isValidThemeId(params.from)) {
      // Clone from preset
      initialVariables = PRESET_THEME_VARIABLES[params.from];
    } else {
      // Clone from custom theme
      const source = await getCustomThemeById(params.from, user.id);
      if (source != null) {
        initialVariables = source.variables as ThemeVariables;
        initialName = source.name;
      }
    }
  }

  const existingThemes = await getCustomThemesByUserId(user.id);
  const existingNames = existingThemes.map((t) => t.name);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("createTheme")}</h1>
      <ThemeStudioContent
        existingNames={existingNames}
        initialName={initialName}
        initialVariables={initialVariables}
        mode="create"
        user={user}
      />
    </div>
  );
};

export default NewThemePage;
