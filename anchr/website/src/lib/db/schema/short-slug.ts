import { sql } from "drizzle-orm";
import { boolean, check, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const shortSlugsTable = pgTable(
  "short_slugs",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    /** FK to links.id — enforced via migration SQL to avoid circular imports. */
    linkId: text("link_id"),
    /** FK to short_links.id — enforced via migration SQL to avoid circular imports. */
    shortLinkId: text("short_link_id"),
    slug: text("slug").primaryKey(),
    tombstoned: boolean("tombstoned").default(false).notNull(),
    type: text("type").notNull(),
    userId: text("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    index("short_slugs_user_id_idx").on(table.userId),
    check(
      "short_slugs_exactly_one_target",
      sql`${table.tombstoned} = true OR (${table.linkId} IS NOT NULL AND ${table.shortLinkId} IS NULL) OR (${table.linkId} IS NULL AND ${table.shortLinkId} IS NOT NULL)`,
    ),
  ],
);
