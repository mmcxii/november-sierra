import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { linksTable } from "./link";
import { usersTable } from "./user";

export const clicksTable = pgTable(
  "clicks",
  {
    browser: text("browser"),
    city: text("city"),
    country: text("country"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    device: text("device"),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    linkId: text("link_id")
      .references(() => linksTable.id, { onDelete: "cascade" })
      .notNull(),
    os: text("os"),
    referrer: text("referrer"),
    userId: text("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    index("clicks_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("clicks_link_id_created_at_idx").on(table.linkId, table.createdAt),
  ],
);
