import { type CardTheme, THEMES, applyThemeProperties } from "@/components/marketing/link-page-mockup/constants";

export type { CardTheme };
export { applyThemeProperties };

export function getCardTheme(themeId: string): CardTheme {
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}
