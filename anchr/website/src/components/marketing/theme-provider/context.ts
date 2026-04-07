"use client";

import * as React from "react";

type Theme = "dark" | "light";

export type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

export const MarketingThemeContext = React.createContext<ThemeContextValue>({ theme: "dark", toggle: () => {} });
