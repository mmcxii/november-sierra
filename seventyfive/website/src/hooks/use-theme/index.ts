"use client";

import { applyTheme, THEME_STORAGE_KEY, type ThemeMode } from "@/lib/theme";
import * as React from "react";

export type { ThemeMode };

type UseThemeReturn = {
  mode: ThemeMode;
  mounted: boolean;
  setMode: (next: ThemeMode) => void;
};

export function useTheme(): UseThemeReturn {
  //* State
  const [mode, setModeState] = React.useState<ThemeMode>("system");
  const [mounted, setMounted] = React.useState(false);

  //* Handlers
  const setMode = React.useCallback((next: ThemeMode) => {
    setModeState(next);
    applyTheme(next);
  }, []);

  //* Effects
  React.useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setModeState(stored);
    } else {
      setModeState("system");
    }
    setMounted(true);
  }, []);

  return { mode, mounted, setMode };
}
