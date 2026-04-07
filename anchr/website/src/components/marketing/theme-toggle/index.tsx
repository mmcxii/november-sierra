"use client";

import { useMarketingTheme } from "@/components/marketing/theme-provider";
import { Moon, Sun } from "lucide-react";

export const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useMarketingTheme();

  return (
    <button
      aria-label="Toggle theme"
      className="m-border-color-muted-15 fixed right-5 bottom-20 z-50 flex size-10 items-center justify-center rounded-full border bg-[var(--m-card-bg)] backdrop-blur-md transition-all duration-200 hover:scale-105 sm:bottom-5"
      onClick={toggle}
    >
      {theme === "dark" ? <Sun className="m-accent-color size-4" /> : <Moon className="m-accent-color size-4" />}
    </button>
  );
};
