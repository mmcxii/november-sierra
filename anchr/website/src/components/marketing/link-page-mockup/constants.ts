import { type ThemeId, THEME_IDS, THEMES, applyTheme } from "@/lib/themes";
import { BookOpen, CalendarDays, Video, Zap } from "lucide-react";
import { siInstagram, siTelegram, siX } from "simple-icons";

export { applyTheme };

export const BASE = { rotateX: 12, rotateY: 22, rotateZ: -3 };
export const FLIP_DURATION = 1600;

export type MockupTheme = {
  demoHandle: string;
  demoName: string;
  id: ThemeId;
  name: string;
};

export const MOCKUP_THEMES: MockupTheme[] = THEME_IDS.map((id) => ({
  demoHandle: "@calvin",
  demoName: "Calvin River",
  id,
  name: THEMES[id].name,
}));

export const SOCIAL_ICONS = [
  { label: "X", path: siX.path },
  { label: "Instagram", path: siInstagram.path },
  { label: "Telegram", path: siTelegram.path },
  { Icon: Zap, label: "Nostr" },
] as const;

export const LINKS = [
  { icon: Video, label: "YouTube Channel" },
  { icon: BookOpen, label: "Latest Blog Post" },
  { icon: CalendarDays, label: "Book a Call" },
] as const;
