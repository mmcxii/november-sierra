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
    d: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.602 17.147c-.263.074-.538.112-.822.112H9.22c-.284 0-.56-.038-.822-.112A3.604 3.604 0 016 13.602V10.4a3.604 3.604 0 013.602-3.602h5.56a3.604 3.604 0 012.397 1.147A3.58 3.58 0 0118.6 10.4v3.202a3.604 3.604 0 01-2.998 3.545zM16 10a1 1 0 10-2 0 1 1 0 002 0zm-4 0a1 1 0 10-2 0 1 1 0 002 0z",
  },
  venmo: {
    d: "M20.276 2c.91 1.5 1.324 3.05 1.324 5.005 0 6.24-5.326 14.39-9.652 20.095H5.2L2.4 3.295 9.076 2.7l1.576 12.66C12.276 12.81 14.6 8.005 14.6 5.26c0-1.89-.576-3.18-1.326-4.21z",
  },
};
