import { ThemeStudioContent } from "@/components/dashboard/theme-studio-content";
import { requireUser } from "@/lib/auth";
import { getCustomThemeById, getCustomThemesByUserId } from "@/lib/db/queries/custom-theme";
import { initTranslations } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import * as React from "react";

export const metadata: Metadata = {
  title: "Edit Theme",
};

type EditThemePageProps = {
  params: Promise<{ themeId: string }>;
};

const EditThemePage: React.FC<EditThemePageProps> = async (props) => {
  const { params } = props;
  const { themeId } = await params;
  const user = await requireUser();
  const { t } = await initTranslations();

  const theme = await getCustomThemeById(themeId, user.id);
  if (theme == null) {
    notFound();
  }

  const existingThemes = await getCustomThemesByUserId(user.id);
  const existingNames = existingThemes.filter((t) => t.id !== theme.id).map((t) => t.name);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("editTheme")}</h1>
      <ThemeStudioContent existingNames={existingNames} mode="edit" theme={theme} user={user} />
    </div>
  );
};

export default EditThemePage;
