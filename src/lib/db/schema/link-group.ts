import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const linkGroupsTable = pgTable("link_groups", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  isQuickLinks: boolean("is_quick_links").default(false).notNull(),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  userId: text("user_id")
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  visible: boolean("visible").default(true).notNull(),
});
