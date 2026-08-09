"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import type { ThemeMode } from "@/lib/theme";
import { Monitor, Moon, Sun } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { MODE_OPTIONS } from "./utils";

export const ThemeToggle: React.FC = () => {
  //* State
  const { mode, setMode } = useTheme();
  const { t } = useTranslation();

  //* Handlers
  const handleValueChange = (value: string) => {
    setMode(value as ThemeMode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("toggleTheme")}
          className="border-sf-border bg-sf-elevated text-sf-muted hover:text-sf-text rounded-[var(--sf-radius)] border p-2 transition-colors"
          type="button"
        >
          {mode === "system" ? <Monitor className="size-4" /> : null}
          {mode === "light" ? <Sun className="size-4" /> : null}
          {mode === "dark" ? <Moon className="size-4" /> : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup onValueChange={handleValueChange} value={mode}>
          {MODE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <Icon className="size-4 shrink-0" />
                {t(option.label)}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
