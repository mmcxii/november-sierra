import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { linksTable } from "./link";
import { shortLinksTable } from "./short-link";
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
    linkId: text("link_id").references(() => linksTable.id, { onDelete: "cascade" }),
    os: text("os"),
    referrer: text("referrer"),
    shortLinkId: text("short_link_id").references(() => shortLinksTable.id, { onDelete: "cascade" }),
    source: text("source").default("profile").notNull(),
    userId: text("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    index("clicks_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("clicks_link_id_created_at_idx").on(table.linkId, table.createdAt),
    index("clicks_short_link_id_created_at_idx").on(table.shortLinkId, table.createdAt),
    check(
      "clicks_exactly_one_target",
      sql`(${table.linkId} IS NOT NULL AND ${table.shortLinkId} IS NULL) OR (${table.linkId} IS NULL AND ${table.shortLinkId} IS NOT NULL)`,
    ),
  ],
);
