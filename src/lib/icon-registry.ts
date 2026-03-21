/**
 * Curated icon registry for the custom icon picker.
 * Icons are stored as `lucide:icon-name` or `si:brand-name` format.
 */

export type IconEntry = {
  category: "brand" | "general";
  id: string;
  keywords: string[];
  name: string;
};

// ─── Simple Icons (brands) ──────────────────────────────────────────────────

const SI_ICONS: Omit<IconEntry, "category">[] = [
  { id: "si:apple", keywords: ["mac", "ios", "iphone"], name: "Apple" },
  { id: "si:applepodcasts", keywords: ["podcast", "audio"], name: "Apple Podcasts" },
  { id: "si:behance", keywords: ["design", "portfolio"], name: "Behance" },
  { id: "si:bitcoin", keywords: ["crypto", "btc", "currency"], name: "Bitcoin" },
  { id: "si:bluesky", keywords: ["social", "microblog"], name: "Bluesky" },
  { id: "si:buymeacoffee", keywords: ["donate", "tip", "support"], name: "Buy Me a Coffee" },
  { id: "si:cashapp", keywords: ["payment", "money", "cash"], name: "Cash App" },
  { id: "si:discord", keywords: ["chat", "gaming", "community"], name: "Discord" },
  { id: "si:dribbble", keywords: ["design", "portfolio", "creative"], name: "Dribbble" },
  { id: "si:dropbox", keywords: ["cloud", "storage", "files"], name: "Dropbox" },
  { id: "si:etsy", keywords: ["shop", "handmade", "craft"], name: "Etsy" },
  { id: "si:facebook", keywords: ["social", "meta"], name: "Facebook" },
  { id: "si:figma", keywords: ["design", "ui", "prototype"], name: "Figma" },
  { id: "si:github", keywords: ["code", "git", "dev", "repository"], name: "GitHub" },
  { id: "si:gitlab", keywords: ["code", "git", "dev", "repository"], name: "GitLab" },
  { id: "si:google", keywords: ["search", "web"], name: "Google" },
  { id: "si:googledrive", keywords: ["cloud", "storage", "files"], name: "Google Drive" },
  { id: "si:instagram", keywords: ["photo", "social", "stories"], name: "Instagram" },
  { id: "si:kick", keywords: ["stream", "live", "gaming"], name: "Kick" },
  { id: "si:kofi", keywords: ["donate", "tip", "support"], name: "Ko-fi" },
  { id: "si:lightning", keywords: ["crypto", "bitcoin", "payment"], name: "Lightning" },
  { id: "si:linktree", keywords: ["links", "bio", "profile"], name: "Linktree" },
  { id: "si:mastodon", keywords: ["social", "fediverse"], name: "Mastodon" },
  { id: "si:medium", keywords: ["blog", "writing", "articles"], name: "Medium" },
  { id: "si:notion", keywords: ["notes", "wiki", "docs"], name: "Notion" },
  { id: "si:onlyfans", keywords: ["content", "creator", "subscription"], name: "OnlyFans" },
  { id: "si:patreon", keywords: ["donate", "subscribe", "creator"], name: "Patreon" },
  { id: "si:paypal", keywords: ["payment", "money"], name: "PayPal" },
  { id: "si:pinterest", keywords: ["pins", "inspiration", "images"], name: "Pinterest" },
  { id: "si:producthunt", keywords: ["startup", "launch", "tech"], name: "Product Hunt" },
  { id: "si:reddit", keywords: ["forum", "community"], name: "Reddit" },
  { id: "si:signal", keywords: ["chat", "messaging", "privacy"], name: "Signal" },
  { id: "si:snapchat", keywords: ["social", "photo", "stories"], name: "Snapchat" },
  { id: "si:soundcloud", keywords: ["music", "audio", "stream"], name: "SoundCloud" },
  { id: "si:spotify", keywords: ["music", "audio", "podcast", "stream"], name: "Spotify" },
  { id: "si:steam", keywords: ["gaming", "games", "store"], name: "Steam" },
  { id: "si:stripe", keywords: ["payment", "billing"], name: "Stripe" },
  { id: "si:substack", keywords: ["newsletter", "blog", "writing"], name: "Substack" },
  { id: "si:telegram", keywords: ["chat", "messaging"], name: "Telegram" },
  { id: "si:threads", keywords: ["social", "meta", "microblog"], name: "Threads" },
  { id: "si:tiktok", keywords: ["video", "social", "short"], name: "TikTok" },
  { id: "si:tumblr", keywords: ["blog", "social"], name: "Tumblr" },
  { id: "si:twitch", keywords: ["stream", "live", "gaming"], name: "Twitch" },
  { id: "si:venmo", keywords: ["payment", "money"], name: "Venmo" },
  { id: "si:vimeo", keywords: ["video", "film"], name: "Vimeo" },
  { id: "si:whatsapp", keywords: ["chat", "messaging"], name: "WhatsApp" },
  { id: "si:x", keywords: ["twitter", "social", "microblog"], name: "X" },
  { id: "si:youtube", keywords: ["video", "stream", "channel"], name: "YouTube" },
];

// ─── Lucide Icons (general purpose) ─────────────────────────────────────────

const LUCIDE_ICONS: Omit<IconEntry, "category">[] = [
  { id: "lucide:anchor", keywords: ["nautical", "marine"], name: "Anchor" },
  { id: "lucide:at-sign", keywords: ["email", "mention"], name: "At Sign" },
  { id: "lucide:award", keywords: ["trophy", "prize", "medal"], name: "Award" },
  { id: "lucide:badge-check", keywords: ["verified", "approved"], name: "Badge Check" },
  { id: "lucide:banknote", keywords: ["money", "cash", "payment"], name: "Banknote" },
  { id: "lucide:bike", keywords: ["cycling", "bicycle", "sport"], name: "Bike" },
  { id: "lucide:bolt", keywords: ["lightning", "power", "electric"], name: "Bolt" },
  { id: "lucide:book-open", keywords: ["read", "blog", "article"], name: "Book Open" },
  { id: "lucide:bookmark", keywords: ["save", "favorite"], name: "Bookmark" },
  { id: "lucide:briefcase", keywords: ["work", "job", "career", "business"], name: "Briefcase" },
  { id: "lucide:brush", keywords: ["art", "paint", "creative", "design"], name: "Brush" },
  { id: "lucide:cake", keywords: ["birthday", "celebration"], name: "Cake" },
  { id: "lucide:calendar", keywords: ["date", "event", "schedule"], name: "Calendar" },
  { id: "lucide:camera", keywords: ["photo", "picture", "image"], name: "Camera" },
  { id: "lucide:clock", keywords: ["time", "schedule"], name: "Clock" },
  { id: "lucide:code", keywords: ["dev", "programming", "developer"], name: "Code" },
  { id: "lucide:coffee", keywords: ["drink", "cafe", "morning"], name: "Coffee" },
  { id: "lucide:cpu", keywords: ["tech", "computer", "hardware"], name: "CPU" },
  { id: "lucide:crown", keywords: ["royal", "premium", "king"], name: "Crown" },
  { id: "lucide:download", keywords: ["save", "file"], name: "Download" },
  { id: "lucide:dumbbell", keywords: ["fitness", "gym", "exercise", "workout"], name: "Dumbbell" },
  { id: "lucide:earth", keywords: ["globe", "world", "website", "web"], name: "Earth" },
  { id: "lucide:flame", keywords: ["fire", "hot", "trending"], name: "Flame" },
  { id: "lucide:gamepad-2", keywords: ["gaming", "play", "controller"], name: "Gamepad" },
  { id: "lucide:gift", keywords: ["present", "birthday", "reward"], name: "Gift" },
  { id: "lucide:graduation-cap", keywords: ["education", "school", "degree"], name: "Graduation Cap" },
  { id: "lucide:guitar", keywords: ["music", "instrument", "band"], name: "Guitar" },
  { id: "lucide:headphones", keywords: ["music", "audio", "listen"], name: "Headphones" },
  { id: "lucide:heart", keywords: ["love", "favorite", "like"], name: "Heart" },
  { id: "lucide:house", keywords: ["home", "homepage"], name: "House" },
  { id: "lucide:image", keywords: ["photo", "picture", "gallery"], name: "Image" },
  { id: "lucide:inbox", keywords: ["email", "mail", "message"], name: "Inbox" },
  { id: "lucide:key", keywords: ["password", "access", "security"], name: "Key" },
  { id: "lucide:landmark", keywords: ["bank", "finance", "government"], name: "Landmark" },
  { id: "lucide:layers", keywords: ["stack", "design", "overlap"], name: "Layers" },
  { id: "lucide:lightbulb", keywords: ["idea", "creative", "tip"], name: "Lightbulb" },
  { id: "lucide:link-2", keywords: ["url", "website", "chain"], name: "Link" },
  { id: "lucide:lock", keywords: ["security", "private", "password"], name: "Lock" },
  { id: "lucide:mail", keywords: ["email", "message", "inbox"], name: "Mail" },
  { id: "lucide:map-pin", keywords: ["location", "place", "address"], name: "Map Pin" },
  { id: "lucide:megaphone", keywords: ["announce", "broadcast", "marketing"], name: "Megaphone" },
  { id: "lucide:mic", keywords: ["audio", "podcast", "voice", "record"], name: "Mic" },
  { id: "lucide:monitor", keywords: ["screen", "computer", "desktop"], name: "Monitor" },
  { id: "lucide:music", keywords: ["song", "audio", "melody"], name: "Music" },
  { id: "lucide:newspaper", keywords: ["news", "article", "press"], name: "Newspaper" },
  { id: "lucide:palette", keywords: ["color", "art", "design", "creative"], name: "Palette" },
  { id: "lucide:pen-tool", keywords: ["write", "draw", "design"], name: "Pen Tool" },
  { id: "lucide:phone", keywords: ["call", "contact", "mobile"], name: "Phone" },
  { id: "lucide:plane", keywords: ["travel", "flight", "airport"], name: "Plane" },
  { id: "lucide:podcast", keywords: ["audio", "show", "episode"], name: "Podcast" },
  { id: "lucide:rocket", keywords: ["launch", "startup", "fast"], name: "Rocket" },
  { id: "lucide:rss", keywords: ["feed", "blog", "subscribe"], name: "RSS" },
  { id: "lucide:scissors", keywords: ["cut", "barber", "hair"], name: "Scissors" },
  { id: "lucide:shield", keywords: ["security", "protect", "safe"], name: "Shield" },
  { id: "lucide:shopping-bag", keywords: ["store", "buy", "ecommerce"], name: "Shopping Bag" },
  { id: "lucide:shopping-cart", keywords: ["store", "buy", "ecommerce"], name: "Shopping Cart" },
  { id: "lucide:sparkles", keywords: ["magic", "ai", "new", "special"], name: "Sparkles" },
  { id: "lucide:star", keywords: ["favorite", "rating", "review"], name: "Star" },
  { id: "lucide:store", keywords: ["shop", "business", "retail"], name: "Store" },
  { id: "lucide:terminal", keywords: ["code", "dev", "cli", "command"], name: "Terminal" },
  { id: "lucide:ticket", keywords: ["event", "pass", "admission"], name: "Ticket" },
  { id: "lucide:trophy", keywords: ["award", "winner", "achievement"], name: "Trophy" },
  { id: "lucide:tv", keywords: ["screen", "video", "show"], name: "TV" },
  { id: "lucide:umbrella", keywords: ["rain", "weather", "protection"], name: "Umbrella" },
  { id: "lucide:user", keywords: ["person", "profile", "account"], name: "User" },
  { id: "lucide:utensils", keywords: ["food", "restaurant", "dining"], name: "Utensils" },
  { id: "lucide:video", keywords: ["camera", "record", "film"], name: "Video" },
  { id: "lucide:wallet", keywords: ["money", "payment", "finance"], name: "Wallet" },
  { id: "lucide:wand-sparkles", keywords: ["magic", "ai", "generate"], name: "Wand" },
  { id: "lucide:wrench", keywords: ["tool", "fix", "settings", "repair"], name: "Wrench" },
  { id: "lucide:zap", keywords: ["lightning", "fast", "energy", "power"], name: "Zap" },
];

// ─── Combined registry ──────────────────────────────────────────────────────

export const ICON_REGISTRY: IconEntry[] = [
  ...SI_ICONS.map((icon) => ({ ...icon, category: "brand" as const })),
  ...LUCIDE_ICONS.map((icon) => ({ ...icon, category: "general" as const })),
];

/** Map platform auto-detect IDs to their icon registry IDs. */
const PLATFORM_TO_ICON_ID: Record<string, string> = {
  bitcoin: "si:bitcoin",
  buymeacoffee: "si:buymeacoffee",
  cashapp: "si:cashapp",
  github: "si:github",
  instagram: "si:instagram",
  kofi: "si:kofi",
  lightning: "si:lightning",
  nostr: "si:mastodon",
  patreon: "si:patreon",
  paypal: "si:paypal",
  tiktok: "si:tiktok",
  twitch: "si:twitch",
  venmo: "si:venmo",
  x: "si:x",
  youtube: "si:youtube",
};

/**
 * Search icons by query string. Returns all icons if query is empty.
 * Matches against name, id, and keywords.
 */
export function searchIcons(query: string): IconEntry[] {
  if (query.length === 0) {
    return ICON_REGISTRY;
  }

  const q = query.toLowerCase();

  return ICON_REGISTRY.filter(
    (icon) =>
      icon.name.toLowerCase().includes(q) ||
      icon.id.toLowerCase().includes(q) ||
      icon.keywords.some((kw) => kw.includes(q)),
  );
}

/**
 * Get suggested icon IDs for a given platform.
 * Returns the matching icon ID if the platform has one in the registry.
 */
export function getSuggestedIconId(platform: null | string): null | string {
  if (platform == null) {
    return null;
  }

  return PLATFORM_TO_ICON_ID[platform] ?? null;
}

/** Look up an icon entry by its full ID (e.g. "lucide:heart", "si:github"). */
export function getIconEntry(id: string): undefined | IconEntry {
  return ICON_REGISTRY.find((icon) => icon.id === id);
}

/** Parse icon ID into provider and name. */
export function parseIconId(id: string): null | { name: string; provider: "lucide" | "si" } {
  const [provider, ...rest] = id.split(":");
  const name = rest.join(":");

  if ((provider === "lucide" || provider === "si") && name.length > 0) {
    return { name, provider };
  }

  return null;
}
