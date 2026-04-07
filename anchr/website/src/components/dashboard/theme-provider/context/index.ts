import type { ThemeId } from "@/lib/themes";
import * as React from "react";

export type UiMode = "dark" | "light" | "system";

export type DashboardThemeContextValue = {
  isDark: boolean;
  mode: UiMode;
  preferredDark: ThemeId;
  preferredLight: ThemeId;
  resolvedTheme: ThemeId;
  setMode: (mode: UiMode) => void;
  setPreferredDark: (id: ThemeId) => void;
  setPreferredLight: (id: ThemeId) => void;
};

export const DashboardThemeContext = React.createContext<null | DashboardThemeContextValue>(null);

export function useDashboardTheme(): DashboardThemeContextValue {
  const ctx = React.useContext(DashboardThemeContext);
  if (ctx == null) {
    throw new Error("useDashboardTheme must be used within DashboardThemeProvider");
  }
  return ctx;
}
