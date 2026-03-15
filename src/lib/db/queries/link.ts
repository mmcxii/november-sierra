import { generateSlug } from "@/lib/utils/url";
import { and, eq, like, or } from "drizzle-orm";
import { db } from "../client";
import { linksTable } from "../schema/link";

export async function generateUniqueSlug(userId: string, url: string): Promise<string> {
  const baseSlug = generateSlug(url);
  const pathSlug = generateSlug(url, true);

  // Find exact match and hyphen-suffixed slugs (avoids false positives like "x" matching "xylophone")
  const existing = await db
    .select({ slug: linksTable.slug })
    .from(linksTable)
    .where(
      and(eq(linksTable.userId, userId), or(eq(linksTable.slug, baseSlug), like(linksTable.slug, `${baseSlug}-%`))),
    );

  const taken = new Set(existing.map((r) => r.slug));

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
