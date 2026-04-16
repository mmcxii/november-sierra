import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";
import { createHash } from "crypto";
import { and, count, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { boolean, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

const usersTable = pgTable("users", {
  avatarUrl: text("avatar_url"),
  billingInterval: text("billing_interval"),
  currentPeriodEnd: timestamp("current_period_end"),
  domainRemovedAt: timestamp("domain_removed_at"),
  id: text("id").primaryKey(),
  pageDarkEnabled: boolean("page_dark_enabled").default(true).notNull(),
  pageDarkTheme: text("page_dark_theme").default("dark-depths").notNull(),
  pageLightEnabled: boolean("page_light_enabled").default(true).notNull(),
  pageLightTheme: text("page_light_theme").default("stateroom").notNull(),
  paymentFailedAt: timestamp("payment_failed_at"),
  proExpiresAt: timestamp("pro_expires_at"),
  shortDomain: text("short_domain"),
  shortDomainVerified: boolean("short_domain_verified").default(false).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionCancelAt: timestamp("subscription_cancel_at"),
  tier: text("tier").default("free").notNull(),
  username: text("username").unique().notNull(),
});

const shortSlugsTable = pgTable("short_slugs", {
  linkId: text("link_id"),
  shortLinkId: text("short_link_id"),
  slug: text("slug").primaryKey(),
  tombstoned: boolean("tombstoned").default(false).notNull(),
  type: text("type").notNull(),
  userId: text("user_id").notNull(),
});

const shortLinksTable = pgTable("short_links", {
  customSlug: text("custom_slug"),
  expiresAt: timestamp("expires_at"),
  id: text("id").primaryKey(),
  passwordHash: text("password_hash"),
  slug: text("slug").notNull(),
  url: text("url").notNull(),
  userId: text("user_id").notNull(),
});

const clicksTable = pgTable("clicks", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  id: text("id").primaryKey(),
  linkId: text("link_id"),
  shortLinkId: text("short_link_id"),
  source: text("source").default("profile").notNull(),
});

const linksTable = pgTable("links", {
  customShortSlug: text("custom_short_slug"),
  id: text("id").primaryKey(),
  position: integer("position").notNull(),
  shortSlug: text("short_slug"),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  userId: text("user_id").notNull(),
  visible: boolean("visible").default(true).notNull(),
});

const webhookDeliveriesTable = pgTable("webhook_deliveries", {
  attempt: integer("attempt").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  event: text("event").notNull(),
  id: text("id").primaryKey(),
  statusCode: integer("status_code"),
  success: boolean("success").notNull(),
  webhookId: text("webhook_id").notNull(),
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
    billingInterval?: null | string;
    currentPeriodEnd?: null | Date;
    domainRemovedAt?: null | Date;
    paymentFailedAt?: null | Date;
    proExpiresAt?: null | Date;
    stripeCustomerId?: null | string;
    stripeSubscriptionId?: null | string;
    subscriptionCancelAt?: null | Date;
    tier: "free" | "pro";
  },
) {
  const db = getDb();
  await db
    .update(usersTable)
    .set({
      billingInterval: billing.billingInterval ?? null,
      currentPeriodEnd: billing.currentPeriodEnd ?? null,
      domainRemovedAt: billing.domainRemovedAt ?? null,
      paymentFailedAt: billing.paymentFailedAt ?? null,
      proExpiresAt: billing.proExpiresAt ?? null,
      stripeCustomerId: billing.stripeCustomerId ?? null,
      stripeSubscriptionId: billing.stripeSubscriptionId ?? null,
      subscriptionCancelAt: billing.subscriptionCancelAt ?? null,
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

/** 1×1 transparent PNG as a data URL — lightweight, no external dependency. */
export const TEST_AVATAR_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

/**
 * Set a user's avatar URL directly in the database. Does NOT set customAvatar
 * so teardown won't attempt an UploadThing deletion.
 */
export async function setUserAvatar(username: string, avatarUrl: string): Promise<void> {
  const db = getDb();
  await db.update(usersTable).set({ avatarUrl }).where(eq(usersTable.username, username));
}

/**
 * Clear a user's avatar URL back to null.
 */
export async function clearUserAvatar(username: string): Promise<void> {
  const db = getDb();
  await db.update(usersTable).set({ avatarUrl: null }).where(eq(usersTable.username, username));
}

/**
 * Set a user's custom short URL domain directly in the database, pre-verified so
 * the middleware short-domain lookup resolves without going through the DNS
 * verification UI flow. Used by redirect e2e tests.
 */
export async function setUserShortDomain(username: string, shortDomain: null | string): Promise<void> {
  const db = getDb();
  await db
    .update(usersTable)
    .set({ shortDomain, shortDomainVerified: shortDomain != null })
    .where(eq(usersTable.username, username));
}

/**
 * Directly insert a transitory short link into the database so redirect tests
 * can exercise expiry, password, and tombstone edge cases without going
 * through the creation UI (which does a urlResolves HEAD probe).
 */
export async function insertShortLinkFixture(params: {
  customSlug?: null | string;
  destinationUrl: string;
  expiresAt?: Date;
  passwordHash?: null | string;
  slug: string;
  userId: string;
}): Promise<string> {
  const db = getDb();
  const shortLinkId = crypto.randomUUID();

  // Mirror the production 3-step insert that avoids the circular FK on neon-http.
  await db.insert(shortSlugsTable).values({
    slug: params.slug,
    tombstoned: true,
    type: "transitory",
    userId: params.userId,
  });
  await db.insert(shortLinksTable).values({
    customSlug: params.customSlug ?? null,
    expiresAt: params.expiresAt ?? null,
    id: shortLinkId,
    passwordHash: params.passwordHash ?? null,
    slug: params.slug,
    url: params.destinationUrl,
    userId: params.userId,
  });
  await db.update(shortSlugsTable).set({ shortLinkId, tombstoned: false }).where(eq(shortSlugsTable.slug, params.slug));

  return shortLinkId;
}

/** Tombstone a short_slugs row (same state as post-delete) without deleting the short_links row. */
export async function tombstoneShortSlug(slug: string): Promise<void> {
  const db = getDb();
  await db.update(shortSlugsTable).set({ shortLinkId: null, tombstoned: true }).where(eq(shortSlugsTable.slug, slug));
}

/** Remove a short link fixture and its slug (for test cleanup). */
export async function deleteShortLinkFixture(slug: string): Promise<void> {
  const db = getDb();
  await db.update(shortSlugsTable).set({ shortLinkId: null, tombstoned: true }).where(eq(shortSlugsTable.slug, slug));
  await db.delete(shortSlugsTable).where(eq(shortSlugsTable.slug, slug));
}

/** Nuke every short_link + transitory short_slug for a user. Called as an
 *  arrange step by tests that require the empty-state UI branch — without
 *  this, earlier specs (short-link-api, short-link-webhook) leave rows in
 *  the DB that push the pro user into list-view rendering. */
export async function deleteAllShortLinksForUser(username: string): Promise<void> {
  const db = getDb();
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (user == null) {
    return;
  }
  // Tombstone first so the short_links delete doesn't cascade-kill the slug rows
  // in the middle of the cleanup (even though we delete both, order matters for
  // webhook_deliveries that reference these via webhook_id → wouldn't cascade,
  // but short_slugs.short_link_id → short_links.id does cascade).
  await db.execute(sql`
    UPDATE short_slugs
      SET short_link_id = NULL, tombstoned = true
      WHERE user_id = ${user.id} AND type = 'transitory'
  `);
  await db.execute(sql`DELETE FROM short_links WHERE user_id = ${user.id}`);
  await db.execute(sql`DELETE FROM short_slugs WHERE user_id = ${user.id} AND type = 'transitory'`);
}

/** Produce a real bcrypt hash — needed by the /unlock/<slug> flow since the
 *  server action calls verifyPassword() against whatever hash is in the DB. */
export async function hashShortLinkPassword(password: string): Promise<string> {
  return hash(password, 10);
}

/** Find a short_link row by its customSlug for a given user. Used to verify
 *  that the UI's custom-slug input successfully propagated to the server and
 *  the row was persisted with the expected customSlug value — the toast UI
 *  only surfaces the auto-gen slug, not the customSlug, so UI-level assertions
 *  can't prove this alone. */
export async function findShortLinkByCustomSlug(params: {
  customSlug: string;
  username: string;
}): Promise<null | { customSlug: null | string; id: string; slug: string; url: string }> {
  const db = getDb();
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, params.username));
  if (user == null) {
    return null;
  }
  const [row] = await db
    .select({
      customSlug: shortLinksTable.customSlug,
      id: shortLinksTable.id,
      slug: shortLinksTable.slug,
      url: shortLinksTable.url,
    })
    .from(shortLinksTable)
    .where(and(eq(shortLinksTable.userId, user.id), eq(shortLinksTable.customSlug, params.customSlug)));
  return row ?? null;
}

/** Count webhook delivery rows matching a webhookId and event. The delivery
 *  row is inserted even when the outbound POST fails (see webhook.ts), so
 *  presence alone proves the event fired for this subscription. */
export async function countWebhookDeliveries(params: { event: string; webhookId: string }): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: count() })
    .from(webhookDeliveriesTable)
    .where(and(eq(webhookDeliveriesTable.webhookId, params.webhookId), eq(webhookDeliveriesTable.event, params.event)));
  return row?.n ?? 0;
}

/** Count clicks recorded for a given shortLinkId. Used to verify click-tracking
 *  side effects after a redirect. Click inserts run inside Next.js `after()` so
 *  callers should await a short polling loop rather than assuming immediacy. */
export async function countClicksForShortLink(shortLinkId: string): Promise<number> {
  const db = getDb();
  const [row] = await db.select({ n: count() }).from(clicksTable).where(eq(clicksTable.shortLinkId, shortLinkId));
  return row?.n ?? 0;
}

/** Read the most recent click for a shortLinkId — used to assert the `source`
 *  column was set correctly (profile vs short_url vs direct). */
export async function getLatestClickForShortLink(shortLinkId: string) {
  const db = getDb();
  const [row] = await db
    .select({ createdAt: clicksTable.createdAt, source: clicksTable.source })
    .from(clicksTable)
    .where(eq(clicksTable.shortLinkId, shortLinkId))
    .orderBy(sql`${clicksTable.createdAt} DESC`)
    .limit(1);
  return row ?? null;
}

/** Count clicks for a bio link id. */
export async function countClicksForLink(linkId: string): Promise<number> {
  const db = getDb();
  const [row] = await db.select({ n: count() }).from(clicksTable).where(eq(clicksTable.linkId, linkId));
  return row?.n ?? 0;
}

/** Read the most recent click for a bio link id. */
export async function getLatestClickForLink(linkId: string) {
  const db = getDb();
  const [row] = await db
    .select({ createdAt: clicksTable.createdAt, source: clicksTable.source })
    .from(clicksTable)
    .where(eq(clicksTable.linkId, linkId))
    .orderBy(sql`${clicksTable.createdAt} DESC`)
    .limit(1);
  return row ?? null;
}

/** Look up a bio link's id + url by (userId, slug). Used by e2e to discover
 *  the linkId of a just-created bio link so click-source assertions can be
 *  scoped to that row. */
export async function findBioLinkBySlug(params: {
  slug: string;
  userId: string;
}): Promise<null | { id: string; url: string }> {
  const db = getDb();
  const [row] = await db
    .select({ id: linksTable.id, url: linksTable.url })
    .from(linksTable)
    .where(and(eq(linksTable.userId, params.userId), eq(linksTable.slug, params.slug)));
  return row ?? null;
}

/** Insert a bio link directly with an associated bio-type short_slug row so
 *  redirect tests can exercise the `type='bio'` branch of /r/[slug]. */
export async function insertBioLinkWithShortSlug(params: {
  destinationUrl: string;
  linkSlug: string;
  shortSlug: string;
  title: string;
  userId: string;
}): Promise<string> {
  const db = getDb();
  const linkId = crypto.randomUUID();

  // Insert the bio link first, then the slug pointing at it. short_slugs has a
  // CHECK constraint that requires (link_id NOT NULL XOR short_link_id NOT NULL)
  // when not tombstoned.
  await db.insert(linksTable).values({
    id: linkId,
    position: 0,
    slug: params.linkSlug,
    title: params.title,
    url: params.destinationUrl,
    userId: params.userId,
  });
  await db.insert(shortSlugsTable).values({
    linkId,
    slug: params.shortSlug,
    type: "bio",
    userId: params.userId,
  });
  await db.update(linksTable).set({ shortSlug: params.shortSlug }).where(eq(linksTable.id, linkId));

  return linkId;
}

/** Clean up bio-link fixtures created by insertBioLinkWithShortSlug. */
export async function deleteBioLinkWithShortSlug(linkId: string, shortSlug: string): Promise<void> {
  const db = getDb();
  await db.update(linksTable).set({ shortSlug: null }).where(eq(linksTable.id, linkId));
  await db.delete(shortSlugsTable).where(eq(shortSlugsTable.slug, shortSlug));
  await db.delete(linksTable).where(eq(linksTable.id, linkId));
}

/** Count links that have been backfilled with a short_slug. Used to verify the
 *  migration backfill happens on the e2e DB. */
export async function countLinksWithShortSlug(userId?: string): Promise<number> {
  const db = getDb();
  const [row] =
    userId != null
      ? await db
          .select({ n: count() })
          .from(linksTable)
          .where(and(eq(linksTable.userId, userId), sql`${linksTable.shortSlug} IS NOT NULL`))
      : await db
          .select({ n: count() })
          .from(linksTable)
          .where(sql`${linksTable.shortSlug} IS NOT NULL`);
  return row?.n ?? 0;
}
