import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  displayName: text("display_name"),
  hideBranding: boolean("hide_branding").default(false).notNull(),
  id: text("id").primaryKey(),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  pageDarkTheme: text("page_dark_theme").default("dark-depths").notNull(),
  pageLightTheme: text("page_light_theme").default("stateroom").notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  tier: text("tier").default("free").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  username: text("username").unique().notNull(),
});
