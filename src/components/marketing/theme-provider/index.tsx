"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({ theme: "dark", toggle: () => {} });

export const useMarketingTheme = () => useContext(ThemeContext);

export type MarketingThemeProviderProps = React.PropsWithChildren;

export const MarketingThemeProvider: React.FC<MarketingThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("dark");

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div data-marketing-theme={theme}>{children}</div>
    </ThemeContext.Provider>
  );
};
