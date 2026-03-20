/**
 * Platform detection from URLs.
 *
 * Maps known domains and URI schemes to platform identifiers used for
 * rendering platform-specific icons and styles on link pages.
 */

export const PLATFORM_IDS = [
  "bitcoin",
  "buymeacoffee",
  "cashapp",
  "github",
  "instagram",
  "kofi",
  "lightning",
  "linkedin",
  "nostr",
  "patreon",
  "paypal",
  "tiktok",
  "twitch",
  "venmo",
  "x",
  "youtube",
] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];

export type Platform = {
  brandColor: { dark: string; light: string };
  id: PlatformId;
  name: string;
};

export const PLATFORMS: Record<PlatformId, Platform> = {
  bitcoin: { brandColor: { dark: "#F7931A", light: "#F7931A" }, id: "bitcoin", name: "Bitcoin" },
  buymeacoffee: { brandColor: { dark: "#FFDD00", light: "#BD8B00" }, id: "buymeacoffee", name: "Buy Me a Coffee" },
  cashapp: { brandColor: { dark: "#00D54B", light: "#00D54B" }, id: "cashapp", name: "Cash App" },
  github: { brandColor: { dark: "#E6EDF3", light: "#24292F" }, id: "github", name: "GitHub" },
  instagram: { brandColor: { dark: "#E4405F", light: "#E4405F" }, id: "instagram", name: "Instagram" },
  kofi: { brandColor: { dark: "#FF6433", light: "#FF6433" }, id: "kofi", name: "Ko-fi" },
  lightning: { brandColor: { dark: "#792EE5", light: "#792EE5" }, id: "lightning", name: "Lightning" },
  linkedin: { brandColor: { dark: "#0A66C2", light: "#0A66C2" }, id: "linkedin", name: "LinkedIn" },
  nostr: { brandColor: { dark: "#8B5CF6", light: "#8B5CF6" }, id: "nostr", name: "Nostr" },
  patreon: { brandColor: { dark: "#FF424D", light: "#FF424D" }, id: "patreon", name: "Patreon" },
  paypal: { brandColor: { dark: "#009CDE", light: "#003087" }, id: "paypal", name: "PayPal" },
  tiktok: { brandColor: { dark: "#FE2C55", light: "#FE2C55" }, id: "tiktok", name: "TikTok" },
  twitch: { brandColor: { dark: "#9146FF", light: "#9146FF" }, id: "twitch", name: "Twitch" },
  venmo: { brandColor: { dark: "#008CFF", light: "#008CFF" }, id: "venmo", name: "Venmo" },
  x: { brandColor: { dark: "#E7E9EA", light: "#14171A" }, id: "x", name: "X" },
  youtube: { brandColor: { dark: "#FF0000", light: "#FF0000" }, id: "youtube", name: "YouTube" },
};

/** Hostname substrings (checked via `endsWith`) mapped to platform IDs. */
const DOMAIN_MAP: [string, PlatformId][] = [
  ["buymeacoffee.com", "buymeacoffee"],
  ["cash.app", "cashapp"],
  ["github.com", "github"],
  ["instagram.com", "instagram"],
  ["ko-fi.com", "kofi"],
  ["linkedin.com", "linkedin"],
  ["patreon.com", "patreon"],
  ["paypal.com", "paypal"],
  ["paypal.me", "paypal"],
  ["tiktok.com", "tiktok"],
  ["twitch.tv", "twitch"],
  ["venmo.com", "venmo"],
  ["x.com", "x"],
  ["twitter.com", "x"],
  ["youtu.be", "youtube"],
  ["youtube.com", "youtube"],
];

/**
 * Detect the platform from a URL string.
 *
 * Parses the hostname and matches against known domains.
 *
 * @returns The platform ID or `null` if no match.
 */
export function detectPlatform(url: string): null | PlatformId {
  const trimmed = url.trim().toLowerCase();

  // Try to parse as URL
  try {
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const hostname = parsed.hostname;

    for (const [domain, platformId] of DOMAIN_MAP) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return platformId;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** Get the brand color pair for a platform, or `undefined` if none. */
export function getPlatformBrandColor(platformId: string): undefined | { dark: string; light: string } {
  if (!isValidPlatformId(platformId)) {
    return undefined;
  }
  return PLATFORMS[platformId].brandColor;
}

/** Type guard for valid platform IDs. */
export function isValidPlatformId(value: string): value is PlatformId {
  return PLATFORM_IDS.includes(value as PlatformId);
}
