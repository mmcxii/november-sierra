import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type UserPreferences = {
  dismissedAlerts?: string[];
};

/** Core user table — holds profile, auth, subscription, and feature-flag state. */
export const usersTable = pgTable("users", {
  avatarUrl: text("avatar_url"),
  billingInterval: text("billing_interval"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  customAvatar: boolean("custom_avatar").default(false).notNull(),
  customDomain: text("custom_domain").unique(),
  customDomainVerified: boolean("custom_domain_verified").default(false).notNull(),
  displayName: text("display_name"),
  domainRemovedAt: timestamp("domain_removed_at"),
  hideBranding: boolean("hide_branding").default(false).notNull(),
  id: text("id").primaryKey(),
  nostrNpub: text("nostr_npub"),
  nostrProfileFetchedAt: timestamp("nostr_profile_fetched_at"),
  nostrRelays: text("nostr_relays"),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  pageDarkEnabled: boolean("page_dark_enabled").default(true).notNull(),
  pageDarkTheme: text("page_dark_theme").default("dark-depths").notNull(),
  pageLightEnabled: boolean("page_light_enabled").default(true).notNull(),
  pageLightTheme: text("page_light_theme").default("stateroom").notNull(),
  paymentFailedAt: timestamp("payment_failed_at"),
  preferences: jsonb("preferences").$type<UserPreferences>().default({}).notNull(),
  proExpiresAt: timestamp("pro_expires_at"),
  referredBy: text("referred_by"),
  shortDomain: text("short_domain").unique(),
  shortDomainVerified: boolean("short_domain_verified").default(false).notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionCancelAt: timestamp("subscription_cancel_at"),
  tier: text("tier").default("free").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  useNostrProfile: boolean("use_nostr_profile").default(false).notNull(),
  username: text("username").unique().notNull(),
});
