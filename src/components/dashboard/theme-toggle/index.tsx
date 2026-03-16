"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DARK_THEME_IDS, THEME_IDS, THEMES, type ThemeId } from "@/lib/themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { useTranslation } from "react-i18next";

export const DashboardThemeToggle: React.FC = () => {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isSystem = mounted && theme === "system";
  const isDark = mounted && DARK_THEME_IDS.has(resolvedTheme as ThemeId);
  const TriggerIcon = isSystem ? Monitor : isDark ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("toggleTheme")}
          className="text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-md p-2 transition-colors"
          type="button"
        >
          <TriggerIcon className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        <DropdownMenuRadioGroup onValueChange={setTheme} value={theme}>
          <DropdownMenuRadioItem value="system">
            <Monitor className="size-4 shrink-0" />
            {t("system")}
          </DropdownMenuRadioItem>
          {THEME_IDS.map((id) => {
            const Icon = DARK_THEME_IDS.has(id) ? Moon : Sun;

            return (
              <DropdownMenuRadioItem key={id} value={id}>
                <Icon className="size-4 shrink-0" />
                {THEMES[id].name}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
