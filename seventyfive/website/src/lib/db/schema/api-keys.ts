import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { betterAuthUserTable } from "./better-auth";

export const apiKeysTable = pgTable(
  "api_keys",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),
    keySuffix: text("key_suffix").notNull(),
    lastUsedAt: timestamp("last_used_at"),
    name: text("name").notNull(),
    revokedAt: timestamp("revoked_at"),
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
    return [index("api_keys_key_hash_revoked_at_idx").on(table.keyHash, table.revokedAt)];
  },
);
