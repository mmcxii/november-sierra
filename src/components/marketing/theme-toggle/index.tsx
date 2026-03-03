"use client";

import { Moon, Sun } from "lucide-react";

import { useMarketingTheme } from "@/components/marketing/theme-provider";

export const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useMarketingTheme();

  return (
    <button
      aria-label="Toggle theme"
      className="fixed right-5 bottom-20 z-50 flex size-10 items-center justify-center rounded-full border bg-[var(--m-card-bg)] backdrop-blur-md transition-all duration-200 hover:scale-105 sm:bottom-5"
      onClick={toggle}
      style={{ borderColor: `rgb(var(--m-muted) / 0.15)` }}
    >
      {theme === "dark" ? (
        <Sun className="size-4" style={{ color: `rgb(var(--m-accent))` }} />
      ) : (
        <Moon className="size-4" style={{ color: `rgb(var(--m-accent))` }} />
      )}
    </button>
  );
};
