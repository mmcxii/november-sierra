// All 15 characters — monospace font keeps the domain segment width stable
// as it cycles. Paths are variable-length; the pill's right edge flexes.
export const DOMAINS = [
  "short.jordan.co",
  "links.alexis.io",
  "brand.calvin.tv",
  "send.oliver.app",
  "go.marina.world",
] as const;

export const PATHS = ["launch", "spring-sale", "newsletter-jul", "vip-access", "team-demo"] as const;
