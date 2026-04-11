import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";
import { count, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { boolean, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  pageDarkEnabled: boolean("page_dark_enabled").default(true).notNull(),
  pageDarkTheme: text("page_dark_theme").default("dark-depths").notNull(),
  pageLightEnabled: boolean("page_light_enabled").default(true).notNull(),
  pageLightTheme: text("page_light_theme").default("stateroom").notNull(),
  proExpiresAt: timestamp("pro_expires_at"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  tier: text("tier").default("free").notNull(),
  username: text("username").unique().notNull(),
});

const apiKeysTable = pgTable("api_keys", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  id: text("id").primaryKey(),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  keySuffix: text("key_suffix").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  name: text("name").notNull(),
  revokedAt: timestamp("revoked_at"),
  userId: text("user_id").notNull(),
});

const customThemesTable = pgTable("custom_themes", {
  borderRadius: integer("border_radius"),
  font: text("font"),
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  rawCss: text("raw_css"),
  userId: text("user_id").notNull(),
  variables: jsonb("variables").notNull(),
});

/** Create a Drizzle client using the DATABASE_URL environment variable. */
function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl == null) {
    throw new Error("DATABASE_URL is required for E2E DB helpers");
  }
  return drizzle(neon(databaseUrl));
}

/**
 * Set a user's tier directly in the database. Useful for testing
 * downgrade/upgrade flows without going through Stripe.
 */
export async function setUserTier(username: string, tier: "free" | "pro") {
  const db = getDb();
  await db.update(usersTable).set({ proExpiresAt: null, tier }).where(eq(usersTable.username, username));
}

/**
 * Read the user's billing-relevant columns so e2e tests can prove that a
 * flow (webhook simulation, manual flip, etc.) produced the expected DB
 * state. Returns `null` if the user doesn't exist.
 */
export async function getUserBilling(username: string) {
  const db = getDb();
  const [user] = await db
    .select({
      proExpiresAt: usersTable.proExpiresAt,
      stripeCustomerId: usersTable.stripeCustomerId,
      stripeSubscriptionId: usersTable.stripeSubscriptionId,
      tier: usersTable.tier,
    })
    .from(usersTable)
    .where(eq(usersTable.username, username));
  return user ?? null;
}

/**
 * Look up a user's primary key (Clerk id) by username. Used by the signed
 * webhook e2e to construct events that reference the correct user.
 */
export async function getUserIdByUsername(username: string): Promise<null | string> {
  const db = getDb();
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  return user?.id ?? null;
}

/**
 * Set a user's billing state (tier + stripe customer/subscription + optional
 * proExpiresAt) so downgrade flows can be seeded with realistic data and
 * cleaned up after the test.
 */
export async function setUserBilling(
  username: string,
  billing: {
    proExpiresAt?: null | Date;
    stripeCustomerId?: null | string;
    stripeSubscriptionId?: null | string;
    tier: "free" | "pro";
  },
) {
  const db = getDb();
  await db
    .update(usersTable)
    .set({
      proExpiresAt: billing.proExpiresAt ?? null,
      stripeCustomerId: billing.stripeCustomerId ?? null,
      stripeSubscriptionId: billing.stripeSubscriptionId ?? null,
      tier: billing.tier,
    })
    .where(eq(usersTable.username, username));
}

/**
 * Delete all custom themes for a user and reset their theme slots and toggles to defaults.
 */
export async function resetCustomThemes(username: string) {
  const db = getDb();
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (user == null) {
    return;
  }
  await db.execute(sql`DELETE FROM custom_themes WHERE user_id = ${user.id}`);
  await db
    .update(usersTable)
    .set({
      pageDarkEnabled: true,
      pageDarkTheme: "dark-depths",
      pageLightEnabled: true,
      pageLightTheme: "stateroom",
    })
    .where(eq(usersTable.id, user.id));
}

/**
 * Read the user's current theme slot values directly from the database.
 */
export async function getUserThemeSlots(username: string) {
  const db = getDb();
  const [user] = await db
    .select({ pageDarkTheme: usersTable.pageDarkTheme, pageLightTheme: usersTable.pageLightTheme })
    .from(usersTable)
    .where(eq(usersTable.username, username));
  return user ?? null;
}

/**
 * Count custom themes for a user directly from the database.
 */
export async function countCustomThemes(username: string) {
  const db = getDb();
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (user == null) {
    return 0;
  }
  const [result] = await db
    .select({ count: count() })
    .from(customThemesTable)
    .where(eq(customThemesTable.userId, user.id));
  return result?.count ?? 0;
}

/**
 * Assign a custom theme to both dark and light slots directly in the database.
 */
export async function assignThemeSlotsDirectly(username: string, themeId: string) {
  const db = getDb();
  await db
    .update(usersTable)
    .set({ pageDarkTheme: themeId, pageLightTheme: themeId })
    .where(eq(usersTable.username, username));
}

/**
 * Get the first custom theme ID for a user.
 */
export async function getFirstCustomThemeId(username: string) {
  const db = getDb();
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (user == null) {
    return null;
  }
  const [theme] = await db
    .select({ id: customThemesTable.id })
    .from(customThemesTable)
    .where(eq(customThemesTable.userId, user.id));
  return theme?.id ?? null;
}

/** Default theme variables matching the dark-depths preset. */
const DEFAULT_VARIABLES = {
  "anchor-color": "#d4b896",
  "avatar-bg": "#050b14",
  "avatar-inner-border": "rgba(146, 176, 190, 0.13)",
  "avatar-outer-ring": "rgba(212, 184, 150, 0.30)",
  border: "rgba(146, 176, 190, 0.16)",
  brand: "rgba(212, 184, 150, 0.38)",
  "card-bg": "linear-gradient(160deg, #111e2e 0%, #080f1c 55%, #050b14 100%)",
  divider: "rgba(146, 176, 190, 0.09)",
  "featured-bg": "rgba(212, 184, 150, 0.10)",
  "featured-border": "rgba(212, 184, 150, 0.35)",
  "featured-icon-bg": "rgba(212, 184, 150, 0.20)",
  "featured-icon-color": "#d4b896",
  "featured-text": "#d4b896",
  "glow-bg": "radial-gradient(ellipse, #243550 0%, transparent 70%)",
  hairline: "#d4b896",
  "link-bg": "rgba(5, 11, 20, 0.60)",
  "link-border": "rgba(146, 176, 190, 0.09)",
  "link-icon-bg": "rgba(146, 176, 190, 0.09)",
  "link-icon-color": "rgba(146, 176, 190, 0.55)",
  "link-text": "rgba(146, 176, 190, 0.70)",
  "name-color": "#ffffff",
};

/**
 * Insert a custom theme directly in the database and return its ID.
 * Accepts optional overrides for any column (variables are deep-merged with defaults).
 */
export async function insertCustomTheme(
  username: string,
  overrides?: {
    borderRadius?: number;
    font?: string;
    name?: string;
    rawCss?: string;
    variables?: Record<string, string>;
  },
): Promise<string> {
  const db = getDb();
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (user == null) {
    throw new Error(`User "${username}" not found`);
  }

  const id = crypto.randomUUID();
  const variables = { ...DEFAULT_VARIABLES, ...overrides?.variables };

  await db.insert(customThemesTable).values({
    borderRadius: overrides?.borderRadius ?? null,
    font: overrides?.font ?? null,
    id,
    name: overrides?.name ?? `E2E Theme ${id.slice(0, 6)}`,
    rawCss: overrides?.rawCss ?? null,
    userId: user.id,
    variables,
  });

  return id;
}

/**
 * Create a test API key directly in the database and return the raw key.
 * The raw key is `anc_k_` + 32 random alphanumeric characters.
 */
export async function createTestApiKey(username: string): Promise<string> {
  const db = getDb();
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (user == null) {
    throw new Error(`User "${username}" not found`);
  }

  const alphanumeric = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let rawKey = "anc_k_";
  for (let i = 0; i < 32; i++) {
    rawKey += alphanumeric[bytes[i] % alphanumeric.length];
  }

  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const id = crypto.randomUUID();

  await db.insert(apiKeysTable).values({
    id,
    keyHash,
    keyPrefix: rawKey.slice(0, 10),
    keySuffix: rawKey.slice(-4),
    name: `E2E MCP smoke test (${username})`,
    userId: user.id,
  });

  return rawKey;
}

/**
 * Delete all API keys for a test user.
 */
export async function deleteTestApiKeys(username: string): Promise<void> {
  const db = getDb();
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (user == null) {
    return;
  }
  await db.execute(sql`DELETE FROM api_keys WHERE user_id = ${user.id} AND name LIKE 'E2E MCP%'`);
}
