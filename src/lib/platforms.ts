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
  id: PlatformId;
  name: string;
};

export const PLATFORMS: Record<PlatformId, Platform> = {
  bitcoin: { id: "bitcoin", name: "Bitcoin" },
  buymeacoffee: { id: "buymeacoffee", name: "Buy Me a Coffee" },
  cashapp: { id: "cashapp", name: "Cash App" },
  github: { id: "github", name: "GitHub" },
  instagram: { id: "instagram", name: "Instagram" },
  kofi: { id: "kofi", name: "Ko-fi" },
  lightning: { id: "lightning", name: "Lightning" },
  linkedin: { id: "linkedin", name: "LinkedIn" },
  nostr: { id: "nostr", name: "Nostr" },
  patreon: { id: "patreon", name: "Patreon" },
  paypal: { id: "paypal", name: "PayPal" },
  tiktok: { id: "tiktok", name: "TikTok" },
  twitch: { id: "twitch", name: "Twitch" },
  venmo: { id: "venmo", name: "Venmo" },
  x: { id: "x", name: "X" },
  youtube: { id: "youtube", name: "YouTube" },
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

/** Type guard for valid platform IDs. */
export function isValidPlatformId(value: string): value is PlatformId {
  return PLATFORM_IDS.includes(value as PlatformId);
}
