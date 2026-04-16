import { db } from "@/lib/db/client";
import { generateUniqueShortSlug } from "@/lib/utils/short-slug";
import { sql } from "drizzle-orm";

/**
 * Assign a globally-unique anch.to short slug to an existing bio link.
 *
 *   1. INSERT short_slugs (type='bio', link_id=<id>) — satisfies the CHECK
 *      constraint (exactly one of link_id / short_link_id is set, or tombstoned=true).
 *   2. UPDATE links SET short_slug=<new_slug> — resolves the forward FK
 *      (links.short_slug → short_slugs.slug).
 *
 * neon-http does not support transactions, so we fold both statements into a
 * single PostgreSQL CTE. This is one network round-trip and PG treats the CTE
 * as a single statement, so the INSERT and UPDATE commit together. Matters at
 * bulk-import scale (import-actions.ts loops N times on link imports).
 */
export async function assignBioLinkShortSlug(params: { linkId: string; userId: string }): Promise<string> {
  const { linkId, userId } = params;
  const shortSlug = await generateUniqueShortSlug();

  await db.execute(sql`
    WITH new_slug AS (
      INSERT INTO short_slugs (slug, link_id, user_id, type, tombstoned, created_at)
      VALUES (${shortSlug}, ${linkId}, ${userId}, 'bio', false, now())
      RETURNING slug
    )
    UPDATE links SET short_slug = (SELECT slug FROM new_slug) WHERE id = ${linkId}
  `);

  return shortSlug;
}
