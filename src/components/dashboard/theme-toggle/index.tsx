"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { useTranslation } from "react-i18next";

export const DashboardThemeToggle: React.FC = () => {
  const { setTheme, theme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const Icon = mounted && theme === "dark" ? Sun : Moon;

  return (
    <button
      aria-label={t("toggleTheme")}
      className="text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-md p-2 transition-colors"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      type="button"
    >
      <Icon className="size-4" />
    </button>
  );
};
