"use client";

import { THEME_IDS } from "@/lib/themes";
import { ThemeProvider } from "next-themes";
import * as React from "react";

export type DashboardThemeProviderProps = React.PropsWithChildren;

export const DashboardThemeProvider: React.FC<DashboardThemeProviderProps> = (props) => {
  const { children } = props;

  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      disableTransitionOnChange
      enableSystem
      storageKey="anchr-ui-theme"
      themes={["light", "dark", ...THEME_IDS]}
      value={{
        dark: "dark-depths",
        "dark-depths": "dark-depths",
        light: "stateroom",
        obsidian: "obsidian",
        seafoam: "seafoam",
        stateroom: "stateroom",
      }}
    >
      {children}
    </ThemeProvider>
  );
};
