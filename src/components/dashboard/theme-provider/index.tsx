"use client";

import { ThemeProvider } from "next-themes";
import * as React from "react";

export type DashboardThemeProviderProps = React.PropsWithChildren;

export const DashboardThemeProvider: React.FC<DashboardThemeProviderProps> = (props) => {
  const { children } = props;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="anchr-theme">
      {children}
    </ThemeProvider>
  );
};
