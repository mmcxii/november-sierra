"use client";

import * as React from "react";

export type Theme = "fog" | "forest";

type UseThemeReturn = {
  mounted: boolean;
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggleTheme: () => void;
};

export function useTheme(): UseThemeReturn {
  //* State
  const [theme, setThemeState] = React.useState<Theme>("forest");
  const [mounted, setMounted] = React.useState(false);

  //* Handlers
  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    if (next === "fog") {
      document.documentElement.setAttribute("data-theme", "fog");
      localStorage.setItem("ns-theme", "fog");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("ns-theme");
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((current) => {
      const next = current === "forest" ? "fog" : "forest";
      if (next === "fog") {
        document.documentElement.setAttribute("data-theme", "fog");
        localStorage.setItem("ns-theme", "fog");
      } else {
        document.documentElement.removeAttribute("data-theme");
        localStorage.removeItem("ns-theme");
      }
      return next;
    });
  }, []);

  //* Effects
  React.useEffect(() => {
    const stored = localStorage.getItem("ns-theme");
    if (stored === "fog") {
      setThemeState("fog");
    }
    setMounted(true);
  }, []);

  return { mounted, setTheme, theme, toggleTheme };
}
