import { generateSlug } from "@/lib/utils/url";
import { and, eq, like, or } from "drizzle-orm";
import { db } from "../client";
import { linksTable } from "../schema/link";
import { linkGroupsTable } from "../schema/link-group";

export async function generateUniqueSlug(userId: string, url: string): Promise<string> {
  const baseSlug = generateSlug(url);
  const pathSlug = generateSlug(url, true);

  // Find exact match and hyphen-suffixed slugs across both links and groups
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

  // Try path-enriched slug before falling back to numbered suffix
  if (pathSlug !== baseSlug && !taken.has(pathSlug)) {
    return pathSlug;
  }

  // Fall back to numbered suffix on the most specific slug available
  const suffix = pathSlug !== baseSlug ? pathSlug : baseSlug;
  let counter = 1;
  while (taken.has(`${suffix}-${counter}`)) {
    counter++;
  }

  return `${suffix}-${counter}`;
}
