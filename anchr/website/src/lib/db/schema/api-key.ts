import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const apiKeysTable = pgTable(
  "api_keys",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),
    keySuffix: text("key_suffix").notNull(),
    lastUsedAt: timestamp("last_used_at"),
    name: text("name").notNull(),
    revokedAt: timestamp("revoked_at"),
    userId: text("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [index("api_keys_key_hash_revoked_at_idx").on(table.keyHash, table.revokedAt)],
);
