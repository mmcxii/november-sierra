import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { shortSlugsTable } from "./short-slug";
import { usersTable } from "./user";

export const shortLinksTable = pgTable(
  "short_links",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    customSlug: text("custom_slug"),
    expiresAt: timestamp("expires_at"),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    passwordHash: text("password_hash"),
    slug: text("slug")
      .references(() => shortSlugsTable.slug, { onDelete: "cascade" })
      .notNull(),
    url: text("url").notNull(),
    userId: text("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    index("short_links_user_id_created_at_idx").on(table.userId, table.createdAt),
    unique("short_links_user_id_custom_slug_unique").on(table.userId, table.customSlug),
  ],
);
