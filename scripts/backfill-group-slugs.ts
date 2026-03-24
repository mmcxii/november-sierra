import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { and, eq, isNull, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// ─── Inline schemas (standalone script, no path aliases) ─────────────────────

const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
});

const linkGroupsTable = pgTable("link_groups", {
  id: text("id").primaryKey(),
  isQuickLinks: boolean("is_quick_links").default(false).notNull(),
  position: integer("position").notNull(),
  slug: text("slug"),
  title: text("title").notNull(),
  userId: text("user_id").notNull(),
  visible: boolean("visible").default(true).notNull(),
});

const linksTable = pgTable("links", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  userId: text("user_id").notNull(),
});

// ─── Slug generation ─────────────────────────────────────────────────────────

function generateSlugFromTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "group"
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl == null) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  // Find all groups with null slugs (excluding Quick Links)
  const groups = await db
    .select({
      id: linkGroupsTable.id,
      title: linkGroupsTable.title,
      userId: linkGroupsTable.userId,
    })
    .from(linkGroupsTable)
    .where(and(isNull(linkGroupsTable.slug), eq(linkGroupsTable.isQuickLinks, false)));

  console.log(`Found ${groups.length} groups without slugs`);

  if (groups.length === 0) {
    console.log("Nothing to backfill");
    return;
  }

  let updated = 0;

  for (const group of groups) {
    const baseSlug = generateSlugFromTitle(group.title);

    // Find all taken slugs across both tables for this user
    const [existingLinks, existingGroups] = await Promise.all([
      db
        .select({ slug: linksTable.slug })
        .from(linksTable)
        .where(
          and(
            eq(linksTable.userId, group.userId),
            or(eq(linksTable.slug, baseSlug), like(linksTable.slug, `${baseSlug}-%`)),
          ),
        ),
      db
        .select({ slug: linkGroupsTable.slug })
        .from(linkGroupsTable)
        .where(
          and(
            eq(linkGroupsTable.userId, group.userId),
            or(eq(linkGroupsTable.slug, baseSlug), like(linkGroupsTable.slug, `${baseSlug}-%`)),
          ),
        ),
    ]);

    const taken = new Set([
      ...existingLinks.map((r) => r.slug),
      ...existingGroups.map((r) => r.slug).filter((s): s is string => s != null),
    ]);

    let slug = baseSlug;
    if (taken.has(slug)) {
      let counter = 1;
      while (taken.has(`${baseSlug}-${counter}`)) {
        counter++;
      }
      slug = `${baseSlug}-${counter}`;
    }

    await db.update(linkGroupsTable).set({ slug }).where(eq(linkGroupsTable.id, group.id));

    console.log(`  ${group.title} → ${slug}`);
    updated++;
  }

  console.log(`\nBackfilled ${updated} group slugs`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
