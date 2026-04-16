import { BarChart3, KeyRound, Link, Link2, Palette, Settings, ShipWheel } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", icon: Link2, labelKey: "links" },
  { href: "/dashboard/short-links", icon: Link, labelKey: "shortLinks" },
  { href: "/dashboard/analytics", icon: BarChart3, labelKey: "analytics" },
  { href: "/dashboard/api", icon: KeyRound, labelKey: "api" },
  { href: "/dashboard/theme", icon: Palette, labelKey: "theme" },
  { href: "/dashboard/settings", icon: Settings, labelKey: "settings" },
] as const;

export const ADMIN_NAV_ITEMS = [{ href: "/dashboard/admin", icon: ShipWheel, labelKey: "admin" }] as const;
