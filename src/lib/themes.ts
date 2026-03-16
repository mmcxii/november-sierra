export type ThemePreview = {
  boxClass: string;
  letterClass: string;
};

export type Theme = {
  /** OG image: anchor icon, username handle, watermark */
  anchorColor: string;
  /** OG image: avatar circle background */
  avatarBg: string;
  /** OG image: avatar ring */
  avatarOuterRing: string;
  name: string;
  /** OG image: display name */
  nameColor: string;
  /** OG image: card background fill */
  ogBackground: string;
  /** Swatch classes for theme picker / onboarding */
  preview: ThemePreview;
};

export const THEME_IDS = ["dark-depths", "stateroom", "obsidian", "seafoam"] as const;
export type ThemeId = (typeof THEME_IDS)[number];
export const DEFAULT_THEME_ID: ThemeId = "dark-depths";
/** Keep in sync with @custom-variant dark in globals.css */
export const DARK_THEME_IDS: ReadonlySet<ThemeId> = new Set(["dark-depths", "obsidian"]);

export const THEMES: Record<ThemeId, Theme> = {
  "dark-depths": {
    anchorColor: "#d4b896",
    avatarBg: "#050b14",
    avatarOuterRing: "rgba(212,184,150,0.30)",
    name: "Dark Depths",
    nameColor: "#ffffff",
    ogBackground: "#0a1729",
    preview: {
      boxClass: "border-anc-gold bg-anc-deep-navy",
      letterClass: "text-anc-gold",
    },
  },
  obsidian: {
    anchorColor: "#c49480",
    avatarBg: "#080606",
    avatarOuterRing: "rgba(196,148,128,0.38)",
    name: "Obsidian",
    nameColor: "#ffffff",
    ogBackground: "#0c0909",
    preview: {
      boxClass: "border-anc-obsidian-accent bg-anc-obsidian-surface",
      letterClass: "text-anc-obsidian-accent",
    },
  },
  seafoam: {
    anchorColor: "#1a7050",
    avatarBg: "#dff5ec",
    avatarOuterRing: "rgba(40,130,95,0.50)",
    name: "Seafoam",
    nameColor: "#061a10",
    ogBackground: "#c2e8d8",
    preview: {
      boxClass: "border-anc-seafoam-accent bg-anc-seafoam-surface",
      letterClass: "text-anc-seafoam-accent",
    },
  },
  stateroom: {
    anchorColor: "#0a1729",
    avatarBg: "#fdfaf2",
    avatarOuterRing: "rgba(10,23,41,0.25)",
    name: "Stateroom",
    nameColor: "#18120a",
    ogBackground: "#f5edda",
    preview: {
      boxClass: "border-anc-deep-navy bg-anc-cream",
      letterClass: "text-anc-deep-navy",
    },
  },
};

export function applyTheme(el: HTMLElement, themeId: ThemeId) {
  el.dataset.theme = themeId;
}

export function getTheme(themeId: string): Theme {
  return isValidThemeId(themeId) ? THEMES[themeId] : THEMES[DEFAULT_THEME_ID];
}

export function isValidThemeId(value: string): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}
