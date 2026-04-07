export const NOSTR_CLIENTS = [
  { id: "primal", name: "Primal", urlTemplate: "https://primal.net/p/{npub}" },
  { id: "snort", name: "Snort", urlTemplate: "https://snort.social/p/{npub}" },
  { id: "coracle", name: "Coracle", urlTemplate: "https://coracle.social/{npub}" },
  { id: "iris", name: "Iris", urlTemplate: "https://iris.to/{npub}" },
  { id: "njump", name: "njump", urlTemplate: "https://njump.me/{npub}" },
  { id: "nostrudel", name: "noStrudel", urlTemplate: "https://nostrudel.ninja/#/u/{npub}" },
  { id: "custom", name: "Custom", urlTemplate: null },
] as const;

export type NostrClientId = (typeof NOSTR_CLIENTS)[number]["id"];

const NPUB_REGEX = /^npub1[a-z0-9]{58}$/;

export function isNpub(value: string): boolean {
  return NPUB_REGEX.test(value.trim());
}

export function buildNostrProfileUrl(npub: string, clientId: NostrClientId, customTemplate?: string): string {
  if (clientId === "custom") {
    if (customTemplate == null) {
      throw new Error("customTemplate is required when clientId is 'custom'");
    }
    return customTemplate.replace("{npub}", npub);
  }

  const client = NOSTR_CLIENTS.find((c) => c.id === clientId);

  if (client == null || client.urlTemplate == null) {
    throw new Error(`Unknown client: ${clientId}`);
  }

  return client.urlTemplate.replace("{npub}", npub);
}

/** Hostname → client ID mapping for known Nostr clients. */
const CLIENT_DOMAIN_MAP: [string, Exclude<NostrClientId, "custom">][] = [
  ["primal.net", "primal"],
  ["snort.social", "snort"],
  ["coracle.social", "coracle"],
  ["iris.to", "iris"],
  ["njump.me", "njump"],
  ["nostrudel.ninja", "nostrudel"],
];

export function detectNostrClient(url: string): { clientId: NostrClientId; customTemplate?: string } {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    for (const [domain, clientId] of CLIENT_DOMAIN_MAP) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return { clientId };
      }
    }

    // No known client matched — reconstruct as custom template
    const npubMatch = url.match(/npub1[a-z0-9]{58}/);
    if (npubMatch != null) {
      const customTemplate = url.replace(npubMatch[0], "{npub}");
      return { clientId: "custom", customTemplate };
    }
  } catch {
    // Invalid URL
  }

  return { clientId: "primal" };
}
