import { boolean, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const betterAuthUserTable = pgTable(
  "ba_user",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    displayUsername: text("display_username"),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    id: text("id").primaryKey(),
    image: text("image"),
    name: text("name").notNull(),
    timeZone: text("time_zone").notNull().default("UTC"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    username: text("username"),
  },
  (table) => {
    return [uniqueIndex("ba_user_username_uniq").on(table.username), uniqueIndex("ba_user_email_uniq").on(table.email)];
  },
);

export const betterAuthSessionTable = pgTable("ba_session", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  id: text("id").primaryKey(),
  ipAddress: text("ip_address"),
  token: text("token").notNull().unique(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(
      () => {
        return betterAuthUserTable.id;
      },
      { onDelete: "cascade" },
    ),
});

export const betterAuthAccountTable = pgTable(
  "ba_account",
  {
    accessToken: text("access_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    accountId: text("account_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    idToken: text("id_token"),
    password: text("password"),
    providerId: text("provider_id").notNull(),
    refreshToken: text("refresh_token"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    userId: text("user_id")
      .notNull()
      .references(
        () => {
          return betterAuthUserTable.id;
        },
        { onDelete: "cascade" },
      ),
  },
  (table) => {
    return [uniqueIndex("ba_account_provider_account_uniq").on(table.providerId, table.accountId)];
  },
);

export const betterAuthVerificationTable = pgTable("ba_verification", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  value: text("value").notNull(),
});
