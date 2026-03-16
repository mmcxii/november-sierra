import { THEMES, THEME_IDS } from "@/lib/themes";

export const STEPS = ["username", "link", "theme", "complete"] as const;
export type Step = (typeof STEPS)[number];

export const ONBOARDING_THEMES = THEME_IDS.map((id) => ({
  ...THEMES[id].preview,
  id,
  label: THEMES[id].name,
}));
