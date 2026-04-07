import { NAV_LINKS } from "@/components/marketing/site-header/constants";

export const MOBILE_LINKS = NAV_LINKS.filter((link) => link.href !== "/");
export const STAGGER_MS = 75;
