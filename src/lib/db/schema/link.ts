import { boolean, integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const linksTable = pgTable(
  "links",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    position: integer("position").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    userId: text("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    visible: boolean("visible").default(true).notNull(),
  },
  (table) => [unique("links_user_id_slug_unique").on(table.userId, table.slug)],
);
