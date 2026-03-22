/**
 * Platform icon components.
 *
 * Uses @icons-pack/react-simple-icons for brand icons.
 * LinkedIn and Nostr are not available in simple-icons; those use custom SVG paths.
 */

import type { PlatformId } from "@/lib/platforms";
import {
  SiBitcoin,
  SiBuymeacoffee,
  SiCashapp,
  SiGithub,
  SiInstagram,
  SiKofi,
  SiLightning,
  SiPatreon,
  SiPaypal,
  SiTiktok,
  SiTwitch,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons";
import type * as React from "react";

type IconComponent = React.ComponentType<{ className?: string; color?: string; size?: number | string }>;

export const PLATFORM_ICON_MAP: Partial<Record<PlatformId, IconComponent>> = {
  bitcoin: SiBitcoin,
  buymeacoffee: SiBuymeacoffee,
  cashapp: SiCashapp,
  github: SiGithub,
  instagram: SiInstagram,
  kofi: SiKofi,
  lightning: SiLightning,
  patreon: SiPatreon,
  paypal: SiPaypal,
  tiktok: SiTiktok,
  twitch: SiTwitch,
  x: SiX,
  youtube: SiYoutube,
};

/** Custom SVG data for platforms not in simple-icons. */
export type CustomIcon = { d: string; viewBox?: string };

export const PLATFORM_CUSTOM_ICONS: Partial<Record<PlatformId, CustomIcon>> = {
  linkedin: {
    d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  nostr: {
    d: "M287 27c-2 2-2 4-3 8-1 8 1 11 12 21 9 9 9 10 9 14 0 6-3 12-7 14-6 3-12 2-26-3-13-4-14-4-23-4-13 0-20 2-37 10-12 5-13 5-37 8-12 1-19 4-23 10-3 6-3 12 0 15 2 3 11 8 14 8 1 0 4-1 7-3 8-4 14-4 21 0 3 2 9 4 13 5 4 1 8 3 9 3 1 1-11 13-17 17-4 2-6 5-8 9-1 2-16 25-20 29 0 1-3 2-5 3-5 1-6 3-5 7 0 1-1 4-1 6-2 5-2 11 0 12 1 0 3-2 4-4 1-2 8-11 14-20 7-8 14-18 16-21 2-3 6-6 8-7 2-1 4-4 4-5 2-4 13-13 19-16 3-1 6-2 6-2 0 1-2 4-4 8-2 3-5 8-6 11-1 4-1 5 0 7 2 3 4 3 24-3 8-3 16-6 17-6 1 0 2 1 3 2 0 2 2 3 4 4 1 0 4 1 6 2 2 1 3 1 4 0 3-2-8-18-12-18-2 0-10 2-18 5-8 2-15 4-16 4-1-1 11-16 15-18 1-1 6-3 10-3 19-4 23-7 27-15 1-3 2-8 2-10 0-5 0-6 7-10 14-9 20-21 19-33-1-6-5-11-13-18-6-5-8-8-5-11 1-1 5-1 9-1 4-1 7-1 8-1 1-2-1-4-4-4-1-1-5-3-7-5-6-4-10-4-14-1z",
    viewBox: "147 22 169 196",
  },
  venmo: {
    d: "M20.276 2c.91 1.5 1.324 3.05 1.324 5.005 0 6.24-5.326 14.39-9.652 20.095H5.2L2.4 3.295 9.076 2.7l1.576 12.66C12.276 12.81 14.6 8.005 14.6 5.26c0-1.89-.576-3.18-1.326-4.21z",
  },
};
