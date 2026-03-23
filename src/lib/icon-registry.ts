/**
 * Curated icon registry for the custom icon picker.
 * Icons are stored as `lucide:icon-name`, `si:brand-name`, or `emoji:slug` format.
 */

export type IconEntry = {
  category: "brand" | "emoji" | "general";
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

// ─── Emojis ─────────────────────────────────────────────────────────────────

/** Map emoji slug names to their Unicode characters. */
export const EMOJI_CHARACTERS: Record<string, string> = {
  // Smileys & Gestures
  "beaming-face": "\u{1F601}",
  "clapping-hands": "\u{1F44F}",
  "crossed-fingers": "\u{1F91E}",
  "face-blowing-a-kiss": "\u{1F618}",
  "face-with-monocle": "\u{1F9D0}",
  "face-with-tears-of-joy": "\u{1F602}",
  "flexed-biceps": "\u{1F4AA}",
  "folded-hands": "\u{1F64F}",
  "grinning-face": "\u{1F600}",
  "nerd-face": "\u{1F913}",
  "ok-hand": "\u{1F44C}",
  "raised-fist": "\u{270A}",
  "rolling-on-the-floor-laughing": "\u{1F923}",
  "shushing-face": "\u{1F92B}",
  "smiling-face-with-halo": "\u{1F607}",
  "smiling-face-with-heart-eyes": "\u{1F60D}",
  "smiling-face-with-sunglasses": "\u{1F60E}",
  "star-struck": "\u{1F929}",
  "thinking-face": "\u{1F914}",
  "thumbs-up": "\u{1F44D}",
  "victory-hand": "\u{270C}\u{FE0F}",
  "waving-hand": "\u{1F44B}",
  "winking-face": "\u{1F609}",
  "writing-hand": "\u{270D}\u{FE0F}",
  "zany-face": "\u{1F92A}",

  // Animals & Nature
  butterfly: "\u{1F98B}",
  "cat-face": "\u{1F431}",
  "crescent-moon": "\u{1F319}",
  "dog-face": "\u{1F436}",
  fire: "\u{1F525}",
  "four-leaf-clover": "\u{1F340}",
  "ocean-wave": "\u{1F30A}",
  "paw-prints": "\u{1F43E}",
  rainbow: "\u{1F308}",
  rose: "\u{1F339}",
  snowflake: "\u{2744}\u{FE0F}",
  star: "\u{2B50}",
  sun: "\u{2600}\u{FE0F}",
  sunflower: "\u{1F33B}",
  unicorn: "\u{1F984}",

  // Food & Drink
  avocado: "\u{1F951}",
  beer: "\u{1F37A}",
  "birthday-cake": "\u{1F382}",
  "chocolate-bar": "\u{1F36B}",
  coffee: "\u{2615}",
  cookie: "\u{1F36A}",
  doughnut: "\u{1F369}",
  hamburger: "\u{1F354}",
  "hot-pepper": "\u{1F336}\u{FE0F}",
  "ice-cream": "\u{1F368}",
  pizza: "\u{1F355}",
  popcorn: "\u{1F37F}",
  sushi: "\u{1F363}",
  taco: "\u{1F32E}",
  "wine-glass": "\u{1F377}",

  // Activities
  basketball: "\u{1F3C0}",
  bowling: "\u{1F3B3}",
  bullseye: "\u{1F3AF}",
  "chess-pawn": "\u{265F}\u{FE0F}",
  guitar: "\u{1F3B8}",
  medal: "\u{1F3C5}",
  "soccer-ball": "\u{26BD}",
  tennis: "\u{1F3BE}",
  trophy: "\u{1F3C6}",
  "video-game": "\u{1F3AE}",

  // Travel & Places
  airplane: "\u{2708}\u{FE0F}",
  beach: "\u{1F3D6}\u{FE0F}",
  camping: "\u{1F3D5}\u{FE0F}",
  car: "\u{1F697}",
  "ferris-wheel": "\u{1F3A1}",
  "globe-showing-americas": "\u{1F30E}",
  "house-with-garden": "\u{1F3E1}",
  "japanese-castle": "\u{1F3EF}",
  mountain: "\u{26F0}\u{FE0F}",
  "night-with-stars": "\u{1F303}",
  rocket: "\u{1F680}",
  sailboat: "\u{26F5}",
  "statue-of-liberty": "\u{1F5FD}",
  sunrise: "\u{1F305}",
  "world-map": "\u{1F5FA}\u{FE0F}",

  // Objects
  bell: "\u{1F514}",
  books: "\u{1F4DA}",
  calendar: "\u{1F4C5}",
  camera: "\u{1F4F7}",
  clipboard: "\u{1F4CB}",
  crown: "\u{1F451}",
  envelope: "\u{2709}\u{FE0F}",
  "hammer-and-wrench": "\u{1F6E0}\u{FE0F}",
  headphones: "\u{1F3A7}",
  hourglass: "\u{231B}",
  key: "\u{1F511}",
  laptop: "\u{1F4BB}",
  lightbulb: "\u{1F4A1}",
  lock: "\u{1F512}",
  "magnifying-glass": "\u{1F50D}",
  megaphone: "\u{1F4E3}",
  microphone: "\u{1F3A4}",
  "money-bag": "\u{1F4B0}",
  paintbrush: "\u{1F58C}\u{FE0F}",
  paperclip: "\u{1F4CE}",
  pencil: "\u{270F}\u{FE0F}",
  pushpin: "\u{1F4CC}",
  scissors: "\u{2702}\u{FE0F}",
  scroll: "\u{1F4DC}",
  telephone: "\u{1F4DE}",

  // Symbols
  "atom-symbol": "\u{269B}\u{FE0F}",
  brain: "\u{1F9E0}",
  "check-mark": "\u{2705}",
  "exclamation-mark": "\u{2757}",
  eye: "\u{1F441}\u{FE0F}",
  "hundred-points": "\u{1F4AF}",
  infinity: "\u{267E}\u{FE0F}",
  lightning: "\u{26A1}",
  "musical-note": "\u{1F3B5}",
  "peace-symbol": "\u{262E}\u{FE0F}",
  "question-mark": "\u{2753}",
  "recycling-symbol": "\u{267B}\u{FE0F}",
  sparkles: "\u{2728}",
  warning: "\u{26A0}\u{FE0F}",
  "yin-yang": "\u{262F}\u{FE0F}",

  // Celebrations
  balloon: "\u{1F388}",
  "christmas-tree": "\u{1F384}",
  "confetti-ball": "\u{1F38A}",
  firecracker: "\u{1F9E8}",
  gift: "\u{1F381}",
  "jack-o-lantern": "\u{1F383}",
  "party-popper": "\u{1F389}",
  piñata: "\u{1FA85}",
  ribbon: "\u{1F380}",
  "wrapped-gift": "\u{1F381}",

  // Hearts
  "black-heart": "\u{1F5A4}",
  "blue-heart": "\u{1F499}",
  "green-heart": "\u{1F49A}",
  "growing-heart": "\u{1F497}",
  "orange-heart": "\u{1F9E1}",
  "purple-heart": "\u{1F49C}",
  "red-heart": "\u{2764}\u{FE0F}",
  "sparkling-heart": "\u{1F496}",
  "white-heart": "\u{1F90D}",
  "yellow-heart": "\u{1F49B}",
};

const EMOJI_ICONS: Omit<IconEntry, "category">[] = [
  // Smileys & Gestures
  { id: "emoji:grinning-face", keywords: ["happy", "smile", "joy"], name: "Grinning Face" },
  { id: "emoji:beaming-face", keywords: ["happy", "smile", "grin"], name: "Beaming Face" },
  { id: "emoji:face-with-tears-of-joy", keywords: ["laugh", "lol", "funny"], name: "Tears of Joy" },
  { id: "emoji:rolling-on-the-floor-laughing", keywords: ["laugh", "rofl", "funny"], name: "ROFL" },
  { id: "emoji:smiling-face-with-heart-eyes", keywords: ["love", "crush", "adore"], name: "Heart Eyes" },
  { id: "emoji:star-struck", keywords: ["wow", "amazing", "celebrity"], name: "Star-Struck" },
  { id: "emoji:winking-face", keywords: ["flirt", "playful", "wink"], name: "Winking Face" },
  { id: "emoji:smiling-face-with-sunglasses", keywords: ["cool", "chill", "confident"], name: "Sunglasses Face" },
  { id: "emoji:thinking-face", keywords: ["think", "hmm", "wonder"], name: "Thinking Face" },
  { id: "emoji:shushing-face", keywords: ["quiet", "secret", "hush"], name: "Shushing Face" },
  { id: "emoji:face-with-monocle", keywords: ["inspect", "investigate", "curious"], name: "Monocle Face" },
  { id: "emoji:nerd-face", keywords: ["geek", "smart", "glasses"], name: "Nerd Face" },
  { id: "emoji:zany-face", keywords: ["crazy", "wild", "goofy"], name: "Zany Face" },
  { id: "emoji:face-blowing-a-kiss", keywords: ["love", "kiss", "flirt"], name: "Blowing a Kiss" },
  { id: "emoji:smiling-face-with-halo", keywords: ["angel", "innocent", "good"], name: "Halo Face" },
  { id: "emoji:waving-hand", keywords: ["hello", "hi", "bye", "wave"], name: "Waving Hand" },
  { id: "emoji:thumbs-up", keywords: ["like", "approve", "yes", "ok"], name: "Thumbs Up" },
  { id: "emoji:clapping-hands", keywords: ["applause", "bravo", "congrats"], name: "Clapping Hands" },
  { id: "emoji:raised-fist", keywords: ["power", "solidarity", "strong"], name: "Raised Fist" },
  { id: "emoji:victory-hand", keywords: ["peace", "win", "two"], name: "Victory Hand" },
  { id: "emoji:crossed-fingers", keywords: ["luck", "hope", "wish"], name: "Crossed Fingers" },
  { id: "emoji:ok-hand", keywords: ["perfect", "fine", "agree"], name: "OK Hand" },
  { id: "emoji:flexed-biceps", keywords: ["strong", "muscle", "power", "fitness"], name: "Flexed Biceps" },
  { id: "emoji:folded-hands", keywords: ["pray", "please", "thanks", "namaste"], name: "Folded Hands" },
  { id: "emoji:writing-hand", keywords: ["write", "author", "pen"], name: "Writing Hand" },

  // Animals & Nature
  { id: "emoji:dog-face", keywords: ["pet", "puppy", "animal"], name: "Dog Face" },
  { id: "emoji:cat-face", keywords: ["pet", "kitty", "animal"], name: "Cat Face" },
  { id: "emoji:unicorn", keywords: ["magic", "fantasy", "horse"], name: "Unicorn" },
  { id: "emoji:butterfly", keywords: ["insect", "nature", "beautiful"], name: "Butterfly" },
  { id: "emoji:rainbow", keywords: ["color", "pride", "weather"], name: "Rainbow" },
  { id: "emoji:four-leaf-clover", keywords: ["luck", "lucky", "irish"], name: "Four Leaf Clover" },
  { id: "emoji:sunflower", keywords: ["flower", "garden", "nature"], name: "Sunflower" },
  { id: "emoji:rose", keywords: ["flower", "love", "romance"], name: "Rose" },
  { id: "emoji:fire", keywords: ["hot", "trending", "flame", "lit"], name: "Fire" },
  { id: "emoji:snowflake", keywords: ["cold", "winter", "ice", "frozen"], name: "Snowflake" },
  { id: "emoji:ocean-wave", keywords: ["sea", "water", "surf", "beach"], name: "Ocean Wave" },
  { id: "emoji:star", keywords: ["favorite", "rating", "night"], name: "Star" },
  { id: "emoji:crescent-moon", keywords: ["night", "sleep", "dark"], name: "Crescent Moon" },
  { id: "emoji:sun", keywords: ["sunny", "warm", "bright", "day"], name: "Sun" },
  { id: "emoji:paw-prints", keywords: ["animal", "pet", "track"], name: "Paw Prints" },

  // Food & Drink
  { id: "emoji:pizza", keywords: ["food", "italian", "slice"], name: "Pizza" },
  { id: "emoji:coffee", keywords: ["drink", "cafe", "morning", "espresso"], name: "Coffee" },
  { id: "emoji:beer", keywords: ["drink", "alcohol", "pub", "bar"], name: "Beer" },
  { id: "emoji:birthday-cake", keywords: ["celebration", "party", "dessert"], name: "Birthday Cake" },
  { id: "emoji:avocado", keywords: ["food", "healthy", "green"], name: "Avocado" },
  { id: "emoji:taco", keywords: ["food", "mexican", "tuesday"], name: "Taco" },
  { id: "emoji:ice-cream", keywords: ["dessert", "sweet", "cold"], name: "Ice Cream" },
  { id: "emoji:doughnut", keywords: ["dessert", "sweet", "donut"], name: "Doughnut" },
  { id: "emoji:cookie", keywords: ["dessert", "sweet", "bake"], name: "Cookie" },
  { id: "emoji:chocolate-bar", keywords: ["candy", "sweet", "dessert"], name: "Chocolate Bar" },
  { id: "emoji:popcorn", keywords: ["movie", "snack", "cinema"], name: "Popcorn" },
  { id: "emoji:wine-glass", keywords: ["drink", "alcohol", "fancy"], name: "Wine Glass" },
  { id: "emoji:hot-pepper", keywords: ["spicy", "food", "chili"], name: "Hot Pepper" },
  { id: "emoji:sushi", keywords: ["food", "japanese", "fish"], name: "Sushi" },
  { id: "emoji:hamburger", keywords: ["food", "burger", "fast-food"], name: "Hamburger" },

  // Activities
  { id: "emoji:soccer-ball", keywords: ["sport", "football", "kick"], name: "Soccer Ball" },
  { id: "emoji:trophy", keywords: ["award", "winner", "champion", "achievement"], name: "Trophy" },
  { id: "emoji:medal", keywords: ["award", "winner", "first-place"], name: "Medal" },
  { id: "emoji:guitar", keywords: ["music", "instrument", "rock"], name: "Guitar" },
  { id: "emoji:video-game", keywords: ["gaming", "play", "controller"], name: "Video Game" },
  { id: "emoji:basketball", keywords: ["sport", "ball", "hoop"], name: "Basketball" },
  { id: "emoji:tennis", keywords: ["sport", "racket", "ball"], name: "Tennis" },
  { id: "emoji:bowling", keywords: ["sport", "pins", "strike"], name: "Bowling" },
  { id: "emoji:chess-pawn", keywords: ["strategy", "board-game", "think"], name: "Chess Pawn" },
  { id: "emoji:bullseye", keywords: ["target", "aim", "goal", "dart"], name: "Bullseye" },

  // Travel & Places
  { id: "emoji:airplane", keywords: ["travel", "flight", "fly"], name: "Airplane" },
  { id: "emoji:globe-showing-americas", keywords: ["world", "earth", "planet", "global"], name: "Globe" },
  { id: "emoji:house-with-garden", keywords: ["home", "residence", "property"], name: "House with Garden" },
  { id: "emoji:rocket", keywords: ["launch", "startup", "space", "fast"], name: "Rocket" },
  { id: "emoji:mountain", keywords: ["hiking", "nature", "climb", "peak"], name: "Mountain" },
  { id: "emoji:camping", keywords: ["outdoor", "tent", "nature"], name: "Camping" },
  { id: "emoji:beach", keywords: ["vacation", "sand", "ocean", "tropical"], name: "Beach" },
  { id: "emoji:ferris-wheel", keywords: ["amusement", "fun", "park"], name: "Ferris Wheel" },
  { id: "emoji:statue-of-liberty", keywords: ["new-york", "usa", "landmark"], name: "Statue of Liberty" },
  { id: "emoji:japanese-castle", keywords: ["japan", "landmark", "temple"], name: "Japanese Castle" },
  { id: "emoji:sunrise", keywords: ["morning", "dawn", "sun"], name: "Sunrise" },
  { id: "emoji:night-with-stars", keywords: ["night", "city", "stars", "evening"], name: "Night with Stars" },
  { id: "emoji:car", keywords: ["drive", "vehicle", "road"], name: "Car" },
  { id: "emoji:sailboat", keywords: ["boat", "sail", "ocean", "water"], name: "Sailboat" },
  { id: "emoji:world-map", keywords: ["travel", "geography", "explore"], name: "World Map" },

  // Objects
  { id: "emoji:lightbulb", keywords: ["idea", "creative", "bright", "tip"], name: "Lightbulb" },
  { id: "emoji:key", keywords: ["password", "access", "unlock"], name: "Key" },
  { id: "emoji:lock", keywords: ["security", "private", "closed"], name: "Lock" },
  { id: "emoji:money-bag", keywords: ["rich", "cash", "finance", "wealth"], name: "Money Bag" },
  { id: "emoji:crown", keywords: ["royal", "king", "queen", "premium"], name: "Crown" },
  { id: "emoji:laptop", keywords: ["computer", "work", "tech", "code"], name: "Laptop" },
  { id: "emoji:camera", keywords: ["photo", "picture", "photography"], name: "Camera" },
  { id: "emoji:microphone", keywords: ["sing", "karaoke", "voice", "podcast"], name: "Microphone" },
  { id: "emoji:headphones", keywords: ["music", "audio", "listen"], name: "Headphones" },
  { id: "emoji:telephone", keywords: ["call", "phone", "contact"], name: "Telephone" },
  { id: "emoji:envelope", keywords: ["email", "mail", "letter", "message"], name: "Envelope" },
  { id: "emoji:megaphone", keywords: ["announce", "loud", "broadcast"], name: "Megaphone" },
  { id: "emoji:bell", keywords: ["notification", "alert", "ring"], name: "Bell" },
  { id: "emoji:hourglass", keywords: ["time", "wait", "patience"], name: "Hourglass" },
  { id: "emoji:magnifying-glass", keywords: ["search", "find", "inspect"], name: "Magnifying Glass" },
  { id: "emoji:hammer-and-wrench", keywords: ["tools", "fix", "build", "repair"], name: "Hammer and Wrench" },
  { id: "emoji:paintbrush", keywords: ["art", "paint", "creative", "design"], name: "Paintbrush" },
  { id: "emoji:pencil", keywords: ["write", "edit", "draw"], name: "Pencil" },
  { id: "emoji:books", keywords: ["read", "study", "library", "learn"], name: "Books" },
  { id: "emoji:scroll", keywords: ["document", "ancient", "paper"], name: "Scroll" },
  { id: "emoji:clipboard", keywords: ["list", "tasks", "notes"], name: "Clipboard" },
  { id: "emoji:calendar", keywords: ["date", "event", "schedule"], name: "Calendar" },
  { id: "emoji:pushpin", keywords: ["pin", "location", "note"], name: "Pushpin" },
  { id: "emoji:paperclip", keywords: ["attach", "file", "office"], name: "Paperclip" },
  { id: "emoji:scissors", keywords: ["cut", "trim", "craft"], name: "Scissors" },

  // Symbols
  { id: "emoji:check-mark", keywords: ["done", "complete", "yes", "correct"], name: "Check Mark" },
  { id: "emoji:sparkles", keywords: ["magic", "new", "shiny", "special"], name: "Sparkles" },
  { id: "emoji:lightning", keywords: ["electric", "fast", "power", "zap"], name: "Lightning" },
  { id: "emoji:warning", keywords: ["alert", "caution", "danger"], name: "Warning" },
  { id: "emoji:infinity", keywords: ["forever", "endless", "loop"], name: "Infinity" },
  { id: "emoji:recycling-symbol", keywords: ["eco", "green", "recycle"], name: "Recycling Symbol" },
  { id: "emoji:hundred-points", keywords: ["perfect", "score", "100"], name: "Hundred Points" },
  { id: "emoji:exclamation-mark", keywords: ["alert", "important", "attention"], name: "Exclamation Mark" },
  { id: "emoji:question-mark", keywords: ["ask", "help", "what", "faq"], name: "Question Mark" },
  { id: "emoji:peace-symbol", keywords: ["peace", "calm", "hippie"], name: "Peace Symbol" },
  { id: "emoji:yin-yang", keywords: ["balance", "harmony", "zen"], name: "Yin Yang" },
  { id: "emoji:atom-symbol", keywords: ["science", "physics", "nuclear"], name: "Atom Symbol" },
  { id: "emoji:musical-note", keywords: ["music", "song", "melody"], name: "Musical Note" },
  { id: "emoji:eye", keywords: ["see", "look", "watch", "vision"], name: "Eye" },
  { id: "emoji:brain", keywords: ["think", "smart", "mind", "intelligence"], name: "Brain" },

  // Celebrations
  { id: "emoji:party-popper", keywords: ["celebrate", "congrats", "birthday", "new-year"], name: "Party Popper" },
  { id: "emoji:gift", keywords: ["present", "birthday", "surprise"], name: "Gift" },
  { id: "emoji:balloon", keywords: ["party", "birthday", "celebration"], name: "Balloon" },
  { id: "emoji:confetti-ball", keywords: ["celebrate", "party", "fun"], name: "Confetti Ball" },
  { id: "emoji:firecracker", keywords: ["celebrate", "bang", "new-year"], name: "Firecracker" },
  { id: "emoji:christmas-tree", keywords: ["holiday", "xmas", "winter"], name: "Christmas Tree" },
  { id: "emoji:jack-o-lantern", keywords: ["halloween", "pumpkin", "spooky"], name: "Jack-O-Lantern" },
  { id: "emoji:wrapped-gift", keywords: ["present", "birthday", "surprise"], name: "Wrapped Gift" },
  { id: "emoji:ribbon", keywords: ["decoration", "bow", "present"], name: "Ribbon" },
  { id: "emoji:piñata", keywords: ["party", "celebration", "candy"], name: "Piñata" },

  // Hearts
  { id: "emoji:red-heart", keywords: ["love", "valentine", "romantic"], name: "Red Heart" },
  { id: "emoji:orange-heart", keywords: ["love", "warm", "friendship"], name: "Orange Heart" },
  { id: "emoji:yellow-heart", keywords: ["love", "happy", "friendship"], name: "Yellow Heart" },
  { id: "emoji:green-heart", keywords: ["love", "nature", "health"], name: "Green Heart" },
  { id: "emoji:blue-heart", keywords: ["love", "trust", "loyalty"], name: "Blue Heart" },
  { id: "emoji:purple-heart", keywords: ["love", "luxury", "royal"], name: "Purple Heart" },
  { id: "emoji:black-heart", keywords: ["love", "dark", "goth"], name: "Black Heart" },
  { id: "emoji:white-heart", keywords: ["love", "pure", "peace"], name: "White Heart" },
  { id: "emoji:sparkling-heart", keywords: ["love", "sparkle", "romantic"], name: "Sparkling Heart" },
  { id: "emoji:growing-heart", keywords: ["love", "affection", "growing"], name: "Growing Heart" },
];

/** Look up an emoji Unicode character by its slug name. */
export function getEmojiCharacter(name: string): undefined | string {
  return EMOJI_CHARACTERS[name];
}

// ─── Combined registry ──────────────────────────────────────────────────────

export const ICON_REGISTRY: IconEntry[] = [
  ...SI_ICONS.map((icon) => ({ ...icon, category: "brand" as const })),
  ...LUCIDE_ICONS.map((icon) => ({ ...icon, category: "general" as const })),
  ...EMOJI_ICONS.map((icon) => ({ ...icon, category: "emoji" as const })),
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
export function parseIconId(id: string): null | { name: string; provider: "emoji" | "lucide" | "si" } {
  const [provider, ...rest] = id.split(":");
  const name = rest.join(":");

  if ((provider === "emoji" || provider === "lucide" || provider === "si") && name.length > 0) {
    return { name, provider };
  }

  return null;
}
