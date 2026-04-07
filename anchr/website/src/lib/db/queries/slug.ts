import { and, eq, like, or } from "drizzle-orm";
import { db } from "../client";
import { linksTable } from "../schema/link";
import { linkGroupsTable } from "../schema/link-group";

/**
 * Check if a slug is available for a user across both links and groups.
 * Optionally exclude a specific link or group from the check (for updates).
 */
export async function isSlugAvailable(
  userId: string,
  slug: string,
  exclude?: { groupId?: string; linkId?: string },
): Promise<boolean> {
  const normalizedSlug = slug.toLowerCase();

  const [existingLink] = await db
    .select({ id: linksTable.id })
    .from(linksTable)
    .where(
      and(
        eq(linksTable.userId, userId),
        eq(linksTable.slug, normalizedSlug),
        exclude?.linkId != null ? undefined : undefined,
      ),
    )
    .limit(1);

  if (existingLink != null && existingLink.id !== exclude?.linkId) {
    return false;
  }

  const [existingGroup] = await db
    .select({ id: linkGroupsTable.id })
    .from(linkGroupsTable)
    .where(and(eq(linkGroupsTable.userId, userId), eq(linkGroupsTable.slug, normalizedSlug)))
    .limit(1);

  if (existingGroup != null && existingGroup.id !== exclude?.groupId) {
    return false;
  }

  return true;
}

/**
 * Generate a slug from a title string.
 */
export function generateSlugFromTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "group"
  );
}

/**
 * Generate a unique slug for a group, checking both links and groups tables.
 */
export async function generateUniqueGroupSlug(userId: string, title: string): Promise<string> {
  const baseSlug = generateSlugFromTitle(title);

  // Find all slugs that start with our base across both tables
  const [existingLinks, existingGroups] = await Promise.all([
    db
      .select({ slug: linksTable.slug })
      .from(linksTable)
      .where(
        and(eq(linksTable.userId, userId), or(eq(linksTable.slug, baseSlug), like(linksTable.slug, `${baseSlug}-%`))),
      ),
    db
      .select({ slug: linkGroupsTable.slug })
      .from(linkGroupsTable)
      .where(
        and(
          eq(linkGroupsTable.userId, userId),
          or(eq(linkGroupsTable.slug, baseSlug), like(linkGroupsTable.slug, `${baseSlug}-%`)),
        ),
      ),
  ]);

  const taken = new Set([
    ...existingLinks.map((r) => r.slug),
    ...existingGroups.map((r) => r.slug).filter((s): s is string => s != null),
  ]);

  if (!taken.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  while (taken.has(`${baseSlug}-${counter}`)) {
    counter++;
  }

  return `${baseSlug}-${counter}`;
}
