"use client";

import type { ActionResult } from "@/app/(dashboard)/dashboard/settings/actions";
import { ThemeSwatch } from "@/components/dashboard/theme-swatch";
import type { TranslationKey } from "@/lib/i18n/i18next.d";
import { type ThemeId, THEMES } from "@/lib/themes";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type ThemePickerProps = {
  currentThemeId: ThemeId;
  themeIds: readonly ThemeId[];
  variant?: "dashboard" | "page";
  action: (theme: ThemeId) => Promise<ActionResult>;
  onThemeChange?: (themeId: ThemeId) => void;
};

export const ThemePicker: React.FC<ThemePickerProps> = (props) => {
  const { action, currentThemeId, onThemeChange, themeIds, variant } = props;

  const { t } = useTranslation();
  const [selectedTheme, setSelectedTheme] = React.useState(currentThemeId);
  const [pendingTheme, setPendingTheme] = React.useState<null | ThemeId>(null);
  const [isPending, startTransition] = React.useTransition();

  //* Handlers
  const handleThemeSwatchOnClick = (themeId: ThemeId) => () => {
    if (themeId === selectedTheme || isPending) {
      return;
    }

    const previousTheme = selectedTheme;
    setSelectedTheme(themeId);
    setPendingTheme(themeId);

    startTransition(async () => {
      const result = await action(themeId);

      if (!result.success) {
        setSelectedTheme(previousTheme);
        toast.error(t(result.error as TranslationKey));
      } else {
        onThemeChange?.(themeId);
      }

      setPendingTheme(null);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {themeIds.map((id) => (
        <ThemeSwatch
          isLoading={isPending && pendingTheme === id}
          isSelected={selectedTheme === id}
          key={id}
          name={THEMES[id].name}
          onClick={handleThemeSwatchOnClick(id)}
          swatch={THEMES[id].swatch}
          variant={variant}
        />
      ))}
    </div>
  );
};
