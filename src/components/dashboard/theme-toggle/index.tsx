"use client";

import type { UiMode } from "@/components/dashboard/theme-provider/context";
import { useDashboardTheme } from "@/components/dashboard/theme-provider/context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Monitor, Moon, Sun } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { MODE_OPTIONS } from "./utils";

export const DashboardThemeToggle: React.FC = () => {
  const { isDark, mode, setMode } = useDashboardTheme();
  const { t } = useTranslation();

  const handleDropdownMenuRadioGroupOnValueChange = (v: string) => setMode(v as UiMode);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("toggleTheme")}
          className="text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-md p-2 transition-colors"
          type="button"
        >
          {mode === "system" && <Monitor className="size-4" />}
          {mode !== "system" && isDark && <Moon className="size-4" />}
          {mode !== "system" && !isDark && <Sun className="size-4" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        <DropdownMenuRadioGroup onValueChange={handleDropdownMenuRadioGroupOnValueChange} value={mode}>
          {MODE_OPTIONS.map(({ icon: Icon, label, value }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="size-4 shrink-0" />
              {t(label)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
