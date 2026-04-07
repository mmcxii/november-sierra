"use client";

import * as React from "react";
import { MarketingThemeContext, type ThemeContextValue } from "./context";

export function useMarketingTheme(): ThemeContextValue {
  return React.useContext(MarketingThemeContext);
}

type Theme = "dark" | "light";

export type MarketingThemeProviderProps = React.PropsWithChildren;

export const MarketingThemeProvider: React.FC<MarketingThemeProviderProps> = (props) => {
  const { children } = props;

  const [theme, setTheme] = React.useState<Theme>("dark");

  const toggle = React.useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <MarketingThemeContext.Provider value={{ theme, toggle }}>
      <div data-marketing-theme={theme}>{children}</div>
    </MarketingThemeContext.Provider>
  );
};
