import { boolean, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const webhooksTable = pgTable(
  "webhooks",
  {
    active: boolean("active").default(true).notNull(),
    consecutiveFailures: integer("consecutive_failures").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    encryptedSecret: text("encrypted_secret").notNull(),
    events: text("events").array().notNull(),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    url: text("url").notNull(),
    userId: text("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [index("webhooks_user_id_idx").on(table.userId)],
);
