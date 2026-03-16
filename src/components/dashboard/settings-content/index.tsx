"use client";

import { PagePreview } from "@/components/dashboard/page-preview";
import { PreviewToggle } from "@/components/dashboard/preview-toggle";
import { ThemePicker } from "@/components/dashboard/theme-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionUser } from "@/lib/auth";
import type { ThemeId } from "@/lib/themes";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type SettingsContentProps = {
  currentThemeId: ThemeId;
  user: SessionUser;
};

export const SettingsContent: React.FC<SettingsContentProps> = (props) => {
  const { currentThemeId, user } = props;

  const { t } = useTranslation();
  const [previewKey, setPreviewKey] = React.useState(currentThemeId);

  const handleThemeChange = React.useCallback((themeId: ThemeId) => {
    setPreviewKey(themeId);
  }, []);

  return (
    <div className="flex gap-8">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex justify-end xl:hidden">
          <PreviewToggle previewKey={previewKey} user={user} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("pageTheme")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemePicker currentThemeId={currentThemeId} onThemeChange={handleThemeChange} />
          </CardContent>
        </Card>
      </div>

      <aside className="hidden w-72 shrink-0 xl:block">
        <div className="sticky top-6">
          <PagePreview previewKey={previewKey} user={user} />
        </div>
      </aside>
    </div>
  );
};
