import type { ApiKeyUser } from "@/lib/api/auth";
import { API_ERROR_CODES } from "@/lib/api/errors";
import type { CreateShortLinkInput, UpdateShortLinkInput } from "@/lib/api/schemas/short-link";
import { shortDomainUrl } from "@/lib/constants/short-domain";
import { db } from "@/lib/db/client";
import { shortLinksTable } from "@/lib/db/schema/short-link";
import { shortSlugsTable } from "@/lib/db/schema/short-slug";
import { usersTable } from "@/lib/db/schema/user";
import { hashPassword } from "@/lib/utils/password";
import { generateUniqueShortSlug } from "@/lib/utils/short-slug";
import { ensureProtocol, isSafeUrl, urlResolves } from "@/lib/utils/url";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { serviceError, serviceSuccess, type ServiceResult } from "./types";

export type ShortLinkResponse = {
  createdAt: string;
  customSlug: null | string;
  expiresAt: null | string;
  id: string;
  passwordProtected: boolean;
  shortUrl: string;
  slug: string;
  url: string;
};

function toShortLinkResponse(row: typeof shortLinksTable.$inferSelect): ShortLinkResponse {
  return {
    createdAt: row.createdAt.toISOString(),
    customSlug: row.customSlug,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    id: row.id,
    passwordProtected: row.passwordHash != null,
    shortUrl: shortDomainUrl(row.slug),
    slug: row.slug,
    url: row.url,
  };
}

export async function listShortLinks(user: ApiKeyUser): Promise<ServiceResult<ShortLinkResponse[]>> {
  const rows = await db
    .select()
    .from(shortLinksTable)
    .where(eq(shortLinksTable.userId, user.id))
    .orderBy(desc(shortLinksTable.createdAt));

  return serviceSuccess(rows.map(toShortLinkResponse));
}

export async function getShortLink(user: ApiKeyUser, id: string): Promise<ServiceResult<ShortLinkResponse>> {
  const [row] = await db
    .select()
    .from(shortLinksTable)
    .where(and(eq(shortLinksTable.id, id), eq(shortLinksTable.userId, user.id)))
    .limit(1);

  if (row == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Short link not found.", 404);
  }

  return serviceSuccess(toShortLinkResponse(row));
}

export async function createShortLink(
  user: ApiKeyUser,
  input: CreateShortLinkInput,
): Promise<ServiceResult<ShortLinkResponse>> {
  const fullUrl = ensureProtocol(input.url);

  if (!isSafeUrl(fullUrl)) {
    return serviceError(API_ERROR_CODES.UNSAFE_URL, "This URL is not allowed.", 400);
  }

  if (!(await urlResolves(fullUrl))) {
    return serviceError(API_ERROR_CODES.URL_UNREACHABLE, "This URL could not be reached.", 400);
  }

  // Validate custom slug: Pro AND a verified short_domain. A customSlug is
  // only resolvable via the custom-short-domain middleware branch (see
  // src/middleware.ts resolveShortDomain + src/app/r/[slug]/page.tsx), so
  // accepting one from a user without a verified short_domain would store
  // data that never gets used. Enforce server-side so the API can't be
  // abused to "reserve" paths — the UI also hides the field in this state.
  if (input.customSlug != null && input.customSlug.length > 0) {
    if (user.tier !== "pro") {
      return serviceError(API_ERROR_CODES.PRO_REQUIRED, "Custom short URLs require a Pro subscription.", 403);
    }

    const [owner] = await db
      .select({ shortDomain: usersTable.shortDomain, shortDomainVerified: usersTable.shortDomainVerified })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (owner == null || owner.shortDomain == null || !owner.shortDomainVerified) {
      return serviceError(
        API_ERROR_CODES.VALIDATION_ERROR,
        "Custom short URLs require a verified short domain. Add one in Settings.",
        400,
      );
    }

    const [existing] = await db
      .select({ id: shortLinksTable.id })
      .from(shortLinksTable)
      .where(and(eq(shortLinksTable.userId, user.id), eq(shortLinksTable.customSlug, input.customSlug)))
      .limit(1);

    if (existing != null) {
      return serviceError(API_ERROR_CODES.PATH_ALREADY_IN_USE, "This custom short URL is already in use.", 409);
    }
  }

  // Validate password (Pro only)
  if (input.password != null && input.password.length > 0 && user.tier !== "pro") {
    return serviceError(API_ERROR_CODES.PRO_REQUIRED, "Password-protected links require a Pro subscription.", 403);
  }

  const slug = await generateUniqueShortSlug();
  const passwordHash = input.password != null && input.password.length > 0 ? await hashPassword(input.password) : null;
  const expiresAt = input.expiresAt != null ? new Date(input.expiresAt) : null;

  // Generate the short link ID upfront so we can wire up the back-reference.
  const shortLinkId = crypto.randomUUID();

  // The two tables form a circular FK (short_links.slug -> short_slugs.slug,
  // short_slugs.short_link_id -> short_links.id, the latter DEFERRABLE INITIALLY
  // DEFERRED) which would normally be created in one transaction. neon-http
  // doesn't support transactions and therefore can't defer FK checks, so we
  // stage the rows in three independently-valid steps:
  //   1. Insert the slug as tombstoned (CHECK passes; both link FKs are NULL).
  //   2. Insert the short_link (its FK to short_slugs.slug now resolves).
  //   3. Update the slug to point at the short_link and clear tombstoned.
  // Between steps 1 and 3 the slug is briefly tombstoned, but it was just
  // minted by generateUniqueShortSlug() so no client knows it yet — the /r/[slug]
  // route correctly 404s tombstoned slugs (src/app/r/[slug]/page.tsx).
  await db.insert(shortSlugsTable).values({
    slug,
    tombstoned: true,
    type: "transitory",
    userId: user.id,
  });

  let created: typeof shortLinksTable.$inferSelect;
  try {
    [created] = await db
      .insert(shortLinksTable)
      .values({
        customSlug: input.customSlug ?? null,
        expiresAt,
        id: shortLinkId,
        passwordHash,
        slug,
        url: fullUrl,
        userId: user.id,
      })
      .returning();
  } catch (err) {
    await db.delete(shortSlugsTable).where(eq(shortSlugsTable.slug, slug));
    throw err;
  }

  try {
    await db.update(shortSlugsTable).set({ shortLinkId, tombstoned: false }).where(eq(shortSlugsTable.slug, slug));
  } catch (err) {
    await db.delete(shortLinksTable).where(eq(shortLinksTable.id, shortLinkId));
    await db.delete(shortSlugsTable).where(eq(shortSlugsTable.slug, slug));
    throw err;
  }

  revalidatePath("/dashboard/short-links");

  return serviceSuccess(toShortLinkResponse(created));
}

export async function updateShortLink(
  user: ApiKeyUser,
  id: string,
  input: UpdateShortLinkInput,
): Promise<ServiceResult<ShortLinkResponse>> {
  const [existing] = await db
    .select()
    .from(shortLinksTable)
    .where(and(eq(shortLinksTable.id, id), eq(shortLinksTable.userId, user.id)))
    .limit(1);

  if (existing == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Short link not found.", 404);
  }

  const updates: Record<string, unknown> = {};

  if (input.url !== undefined) {
    const fullUrl = ensureProtocol(input.url);

    if (!isSafeUrl(fullUrl)) {
      return serviceError(API_ERROR_CODES.UNSAFE_URL, "This URL is not allowed.", 400);
    }

    if (!(await urlResolves(fullUrl))) {
      return serviceError(API_ERROR_CODES.URL_UNREACHABLE, "This URL could not be reached.", 400);
    }

    updates.url = fullUrl;
  }

  if (input.customSlug !== undefined) {
    if (input.customSlug != null && input.customSlug.length > 0) {
      if (user.tier !== "pro") {
        return serviceError(API_ERROR_CODES.PRO_REQUIRED, "Custom short URLs require a Pro subscription.", 403);
      }

      const [owner] = await db
        .select({ shortDomain: usersTable.shortDomain, shortDomainVerified: usersTable.shortDomainVerified })
        .from(usersTable)
        .where(eq(usersTable.id, user.id))
        .limit(1);

      if (owner == null || owner.shortDomain == null || !owner.shortDomainVerified) {
        return serviceError(
          API_ERROR_CODES.VALIDATION_ERROR,
          "Custom short URLs require a verified short domain. Add one in Settings.",
          400,
        );
      }

      if (input.customSlug !== existing.customSlug) {
        const [conflict] = await db
          .select({ id: shortLinksTable.id })
          .from(shortLinksTable)
          .where(and(eq(shortLinksTable.userId, user.id), eq(shortLinksTable.customSlug, input.customSlug)))
          .limit(1);

        if (conflict != null) {
          return serviceError(API_ERROR_CODES.PATH_ALREADY_IN_USE, "This custom short URL is already in use.", 409);
        }
      }
    }
    updates.customSlug = input.customSlug;
  }

  if (input.expiresAt !== undefined) {
    updates.expiresAt = input.expiresAt != null ? new Date(input.expiresAt) : null;
  }

  if (input.password !== undefined) {
    if (input.password != null && input.password.length > 0) {
      if (user.tier !== "pro") {
        return serviceError(API_ERROR_CODES.PRO_REQUIRED, "Password-protected links require a Pro subscription.", 403);
      }
      updates.passwordHash = await hashPassword(input.password);
    } else {
      updates.passwordHash = null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return serviceSuccess(toShortLinkResponse(existing));
  }

  const [updated] = await db
    .update(shortLinksTable)
    .set(updates)
    .where(and(eq(shortLinksTable.id, id), eq(shortLinksTable.userId, user.id)))
    .returning();

  revalidatePath("/dashboard/short-links");

  return serviceSuccess(toShortLinkResponse(updated));
}

export async function deleteShortLink(user: ApiKeyUser, id: string): Promise<ServiceResult<null>> {
  const [existing] = await db
    .select({ id: shortLinksTable.id, slug: shortLinksTable.slug })
    .from(shortLinksTable)
    .where(and(eq(shortLinksTable.id, id), eq(shortLinksTable.userId, user.id)))
    .limit(1);

  if (existing == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Short link not found.", 404);
  }

  // neon-http does not support db.transaction(). Tombstone the slug first to
  // break the FK reference (short_slugs.short_link_id ON DELETE CASCADE would
  // otherwise delete the slug when the short_link is removed); then delete the
  // short_link row.
  await db
    .update(shortSlugsTable)
    .set({ shortLinkId: null, tombstoned: true })
    .where(eq(shortSlugsTable.slug, existing.slug));

  await db.delete(shortLinksTable).where(eq(shortLinksTable.id, id));

  revalidatePath("/dashboard/short-links");

  return serviceSuccess(null);
}

export type BulkCreateShortLinkInput = { url: string }[];

export async function bulkCreateShortLinks(
  user: ApiKeyUser,
  urls: BulkCreateShortLinkInput,
): Promise<ServiceResult<ShortLinkResponse[]>> {
  const results: ShortLinkResponse[] = [];

  for (const item of urls) {
    const result = await createShortLink(user, { url: item.url });
    if (result.error != null) {
      return serviceError(result.error.code, result.error.message, result.error.status);
    }
    results.push(result.data);
  }

  return serviceSuccess(results);
}
