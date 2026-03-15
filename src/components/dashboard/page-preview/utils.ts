import { type CardTheme, THEME_CSS_VARS, THEMES } from "@/components/marketing/link-page-mockup/constants";

export type { CardTheme };

export function getCardTheme(themeId: string): CardTheme {
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}

export function getThemeStyle(theme: CardTheme): Record<string, string> {
  const style: Record<string, string> = {};

  for (const [cssVar, key] of Object.entries(THEME_CSS_VARS)) {
    style[cssVar] = theme[key];
  }

  return style;
}
