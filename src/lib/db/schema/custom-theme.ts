import { integer, jsonb, pgTable, real, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const customThemesTable = pgTable(
  "custom_themes",
  {
    backgroundImage: text("background_image"),
    borderRadius: integer("border_radius"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    font: text("font"),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    overlayColor: text("overlay_color"),
    overlayOpacity: real("overlay_opacity"),
    rawCss: text("raw_css"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    userId: text("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    variables: jsonb("variables").notNull(),
    version: integer("version").default(1).notNull(),
  },
  (table) => [unique("custom_themes_user_id_name_unique").on(table.userId, table.name)],
);
