import { BookOpen, CalendarDays, Youtube, Zap } from "lucide-react";
import { siInstagram, siTelegram, siX } from "simple-icons";

export const BASE = { rotateX: 12, rotateY: 22, rotateZ: -3 };
export const FLIP_DURATION = 1600;

export type CardTheme = {
  anchorColor: string;
  avatarBg: string;
  avatarInnerBorder: string;
  avatarOuterRing: string;
  border: string;
  brand: string;
  cardBg: string;
  divider: string;
  featuredBg: string;
  featuredBorder: string;
  featuredIconBg: string;
  featuredIconColor: string;
  featuredText: string;
  glowBg: string;
  hairline: string;
  handle: string;
  id: string;
  linkBg: string;
  linkBorder: string;
  linkIconBg: string;
  linkIconColor: string;
  linkText: string;
  name: string;
  nameColor: string;
  themeName: string;
};

export const THEMES: CardTheme[] = [
  // Theme 0: Dark Depths — deep nautical dark
  {
    anchorColor: "#d4b896",
    avatarBg: "#050b14",
    avatarInnerBorder: "rgba(146,176,190,0.13)",
    avatarOuterRing: "rgba(212,184,150,0.30)",
    border: "rgba(146,176,190,0.16)",
    brand: "rgba(212,184,150,0.38)",
    cardBg: "linear-gradient(160deg, #111e2e 0%, #080f1c 55%, #050b14 100%)",
    divider: "rgba(146,176,190,0.09)",
    featuredBg: "rgba(212,184,150,0.10)",
    featuredBorder: "rgba(212,184,150,0.35)",
    featuredIconBg: "rgba(212,184,150,0.20)",
    featuredIconColor: "#d4b896",
    featuredText: "#d4b896",
    glowBg: "radial-gradient(ellipse, #243550 0%, transparent 70%)",
    hairline: "#d4b896",
    handle: "@calvin",
    id: "minimal",
    linkBg: "rgba(5,11,20,0.60)",
    linkBorder: "rgba(146,176,190,0.09)",
    linkIconBg: "rgba(146,176,190,0.09)",
    linkIconColor: "rgba(146,176,190,0.55)",
    linkText: "rgba(146,176,190,0.70)",
    name: "Calvin River",
    nameColor: "#ffffff",
    themeName: "Dark Depths",
  },
  // Theme 1: Stateroom — warm cream, dark navy accent (mirror of Dark Depths)
  {
    anchorColor: "#0a1729",
    avatarBg: "#fdfaf2",
    avatarInnerBorder: "rgba(10,23,41,0.10)",
    avatarOuterRing: "rgba(10,23,41,0.25)",
    border: "rgba(10,23,41,0.10)",
    brand: "rgba(10,23,41,0.30)",
    cardBg: "linear-gradient(160deg, #fdfaf2 0%, #f5edda 55%, #ece0c0 100%)",
    divider: "rgba(10,23,41,0.08)",
    featuredBg: "rgba(10,23,41,0.06)",
    featuredBorder: "rgba(10,23,41,0.22)",
    featuredIconBg: "rgba(10,23,41,0.10)",
    featuredIconColor: "#0a1729",
    featuredText: "#0a1729",
    glowBg: "radial-gradient(ellipse, rgba(185,158,90,0.12) 0%, transparent 70%)",
    hairline: "#0a1729",
    handle: "@calvin",
    id: "stateroom",
    linkBg: "rgba(253,250,242,0.80)",
    linkBorder: "rgba(10,23,41,0.08)",
    linkIconBg: "rgba(10,23,41,0.06)",
    linkIconColor: "rgba(10,23,41,0.40)",
    linkText: "rgba(10,23,41,0.55)",
    name: "Calvin River",
    nameColor: "#18120a",
    themeName: "Stateroom",
  },
  // Theme 2: Obsidian & Rose Gold — pure black with rose gold
  {
    anchorColor: "#c49480",
    avatarBg: "#080606",
    avatarInnerBorder: "rgba(196,148,128,0.16)",
    avatarOuterRing: "rgba(196,148,128,0.38)",
    border: "rgba(196,148,128,0.18)",
    brand: "rgba(196,148,128,0.40)",
    cardBg: "linear-gradient(160deg, #141010 0%, #0c0909 55%, #080606 100%)",
    divider: "rgba(196,148,128,0.10)",
    featuredBg: "rgba(196,148,128,0.08)",
    featuredBorder: "rgba(196,148,128,0.32)",
    featuredIconBg: "rgba(196,148,128,0.16)",
    featuredIconColor: "#c49480",
    featuredText: "#c49480",
    glowBg: "radial-gradient(ellipse, rgba(196,148,128,0.08) 0%, transparent 70%)",
    hairline: "#c49480",
    handle: "@calvin",
    id: "obsidian",
    linkBg: "rgba(8,6,6,0.70)",
    linkBorder: "rgba(196,148,128,0.10)",
    linkIconBg: "rgba(196,148,128,0.08)",
    linkIconColor: "rgba(196,148,128,0.50)",
    linkText: "rgba(196,148,128,0.60)",
    name: "Calvin River",
    nameColor: "#ffffff",
    themeName: "Obsidian",
  },
  // Theme 3: Seafoam Morning — white to pale mint, coastal air
  {
    anchorColor: "#1a7050",
    avatarBg: "#dff5ec",
    avatarInnerBorder: "rgba(40,130,95,0.28)",
    avatarOuterRing: "rgba(40,130,95,0.50)",
    border: "rgba(40,130,95,0.30)",
    brand: "rgba(30,120,80,0.60)",
    cardBg: "linear-gradient(160deg, #dff5ec 0%, #c2e8d8 55%, #a4d9c3 100%)",
    divider: "rgba(40,130,95,0.22)",
    featuredBg: "rgba(210,90,70,0.09)",
    featuredBorder: "rgba(210,90,70,0.30)",
    featuredIconBg: "rgba(210,90,70,0.18)",
    featuredIconColor: "#b8503c",
    featuredText: "#a84030",
    glowBg: "radial-gradient(ellipse, rgba(40,160,115,0.18) 0%, transparent 70%)",
    hairline: "#28a070",
    handle: "@calvin",
    id: "seafoam",
    linkBg: "rgba(200,232,216,0.65)",
    linkBorder: "rgba(40,130,95,0.22)",
    linkIconBg: "rgba(40,130,95,0.15)",
    linkIconColor: "rgba(25,110,75,0.75)",
    linkText: "rgba(15,70,45,0.80)",
    name: "Calvin River",
    nameColor: "#061a10",
    themeName: "Seafoam",
  },
];

export const SOCIAL_ICONS = [
  { label: "X", path: siX.path },
  { label: "Instagram", path: siInstagram.path },
  { label: "Telegram", path: siTelegram.path },
  { Icon: Zap, label: "Nostr" },
] as const;

export const LINKS = [
  { icon: Youtube, label: "YouTube Channel" },
  { icon: BookOpen, label: "Latest Blog Post" },
  { icon: CalendarDays, label: "Book a Call" },
] as const;

/** CSS variable name → CardTheme property key mapping. Single source of truth. */
export const THEME_CSS_VARS: Record<string, keyof CardTheme> = {
  "--_mc-anchor-color": "anchorColor",
  "--_mc-avatar-bg": "avatarBg",
  "--_mc-avatar-inner-border": "avatarInnerBorder",
  "--_mc-avatar-outer-ring": "avatarOuterRing",
  "--_mc-border": "border",
  "--_mc-brand": "brand",
  "--_mc-card-bg": "cardBg",
  "--_mc-divider": "divider",
  "--_mc-featured-bg": "featuredBg",
  "--_mc-featured-border": "featuredBorder",
  "--_mc-featured-icon-bg": "featuredIconBg",
  "--_mc-featured-icon-color": "featuredIconColor",
  "--_mc-featured-text": "featuredText",
  "--_mc-glow-bg": "glowBg",
  "--_mc-hairline": "hairline",
  "--_mc-link-bg": "linkBg",
  "--_mc-link-border": "linkBorder",
  "--_mc-link-icon-bg": "linkIconBg",
  "--_mc-link-icon-color": "linkIconColor",
  "--_mc-link-text": "linkText",
  "--_mc-name-color": "nameColor",
};

export function applyThemeProperties(el: HTMLElement, theme: CardTheme) {
  for (const [cssVar, key] of Object.entries(THEME_CSS_VARS)) {
    el.style.setProperty(cssVar, theme[key]);
  }
}
