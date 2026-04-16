import { db } from "@/lib/db/client";
import { shortSlugsTable } from "@/lib/db/schema/short-slug";
import { eq } from "drizzle-orm";

/** Safe alphabet excluding ambiguous characters (0, O, 1, l, I). */
export const SAFE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

/**
 * Generate a slug of the given length from SAFE_ALPHABET using
 * `crypto.getRandomValues` (CSPRNG). Math.random is predictable and shouldn't
 * seed user-facing identifiers that end up as discoverable URL paths.
 *
 * We reject bytes that fall into a biased tail (`bytes[i] >= cap`) and retry,
 * which eliminates modulo bias across the 31-char alphabet. `cap` is the
 * largest multiple of alphabet.length that fits in a byte.
 */
export function generateRandomSlug(length: number): string {
  const alphabet = SAFE_ALPHABET;
  const cap = Math.floor(256 / alphabet.length) * alphabet.length;
  let slug = "";
  while (slug.length < length) {
    const bytes = new Uint8Array(length - slug.length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < bytes.length && slug.length < length; i++) {
      if (bytes[i] < cap) {
        slug += alphabet[bytes[i] % alphabet.length];
      }
    }
  }
  return slug;
}

/** Maximum retries at a given length before bumping to the next. */
const MAX_RETRIES_PER_LENGTH = 3;

/** Starting slug length. */
const DEFAULT_START_LENGTH = 5;

/** Absolute max length to prevent infinite loops. */
const MAX_LENGTH = 12;

export async function generateUniqueShortSlug(startLength = DEFAULT_START_LENGTH): Promise<string> {
  let length = startLength;
  let retries = 0;

  while (length <= MAX_LENGTH) {
    const candidate = generateRandomSlug(length);

    const [existing] = await db
      .select({ slug: shortSlugsTable.slug })
      .from(shortSlugsTable)
      .where(eq(shortSlugsTable.slug, candidate))
      .limit(1);

    if (existing == null) {
      return candidate;
    }

    retries++;
    if (retries >= MAX_RETRIES_PER_LENGTH) {
      length++;
      retries = 0;
    }
  }

  throw new Error("Failed to generate a unique short slug");
}
