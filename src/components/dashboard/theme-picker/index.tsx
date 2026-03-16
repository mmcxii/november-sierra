"use client";

import { updateTheme } from "@/app/(dashboard)/dashboard/settings/actions";
import { type ThemeId, THEMES, THEME_IDS } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type ThemePickerProps = {
  currentThemeId: ThemeId;
  onThemeChange?: (themeId: ThemeId) => void;
};

export const ThemePicker: React.FC<ThemePickerProps> = (props) => {
  const { currentThemeId, onThemeChange } = props;

  //* State
  const { t } = useTranslation();
  const [selectedTheme, setSelectedTheme] = React.useState(currentThemeId);
  const [pendingTheme, setPendingTheme] = React.useState<null | ThemeId>(null);
  const [isPending, startTransition] = React.useTransition();

  //* Handlers
  const handleSelect = (themeId: ThemeId) => {
    if (themeId === selectedTheme) {
      return;
    }

    const previousTheme = selectedTheme;
    setSelectedTheme(themeId);
    setPendingTheme(themeId);

    startTransition(async () => {
      const result = await updateTheme(themeId);

      if (!result.success) {
        setSelectedTheme(previousTheme);
        toast.error(t(result.error ?? "somethingWentWrongPleaseTryAgain"));
      } else {
        onThemeChange?.(themeId);
      }

      setPendingTheme(null);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {THEME_IDS.map((id) => {
        const theme = THEMES[id];
        const isSelected = selectedTheme === id;
        const isLoading = isPending && pendingTheme === id;

        return (
          <button
            className={cn("flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-colors", {
              "border-border hover:border-muted-foreground/40": !isSelected,
              "border-primary": isSelected,
            })}
            key={id}
            onClick={() => handleSelect(id)}
            type="button"
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-md border",
                theme.preview.boxClass,
              )}
            >
              <span className={cn("text-xs font-bold", theme.preview.letterClass)}>A</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{theme.name}</span>
            </div>
            {isSelected &&
              (isLoading ? (
                <Loader2 className="text-primary ml-auto size-4 animate-spin" />
              ) : (
                <Check className="text-primary ml-auto size-4" />
              ))}
          </button>
        );
      })}
    </div>
  );
};
