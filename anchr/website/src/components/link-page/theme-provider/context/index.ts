import * as React from "react";

export type PageMode = "dark" | "light" | "system";

export type LinkPageThemeContextValue = {
  isDark: boolean;
  mode: PageMode;
  setMode: (mode: PageMode) => void;
};

export const LinkPageThemeContext = React.createContext<null | LinkPageThemeContextValue>(null);

export function useLinkPageTheme(): LinkPageThemeContextValue {
  const ctx = React.useContext(LinkPageThemeContext);
  if (ctx == null) {
    throw new Error("useLinkPageTheme must be used within LinkPageThemeProvider");
  }
  return ctx;
}
