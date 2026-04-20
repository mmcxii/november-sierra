import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const betterAuthUserTable = pgTable("ba_user", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  id: text("id").primaryKey(),
  image: text("image"),
  name: text("name").notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
    .references(() => betterAuthUserTable.id, { onDelete: "cascade" }),
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
      .references(() => betterAuthUserTable.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("ba_account_provider_account_uniq").on(table.providerId, table.accountId)],
);

export const betterAuthVerificationTable = pgTable("ba_verification", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  value: text("value").notNull(),
});

export const betterAuthTwoFactorTable = pgTable("ba_two_factor", {
  backupCodes: text("backup_codes").notNull(),
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => betterAuthUserTable.id, { onDelete: "cascade" }),
});

export const recoveryCodesTable = pgTable(
  "recovery_codes",
  {
    codeHash: text("code_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    usedAt: timestamp("used_at"),
    userId: text("user_id")
      .notNull()
      .references(() => betterAuthUserTable.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("recovery_codes_hash_uniq").on(table.codeHash)],
);

export const recoveryLockoutTable = pgTable("recovery_lockouts", {
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: text("user_id")
    .primaryKey()
    .references(() => betterAuthUserTable.id, { onDelete: "cascade" }),
});
