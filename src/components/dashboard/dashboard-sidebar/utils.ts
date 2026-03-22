import { BarChart3, Link2, Settings, ShipWheel } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", icon: Link2, labelKey: "links" },
  { href: "/dashboard/analytics", icon: BarChart3, labelKey: "analytics" },
  { href: "/dashboard/settings", icon: Settings, labelKey: "settings" },
] as const;

export const ADMIN_NAV_ITEMS = [{ href: "/dashboard/admin", icon: ShipWheel, labelKey: "admin" }] as const;
