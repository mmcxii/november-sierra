import type { ApiKeyUser } from "@/lib/api/auth";
import { API_ERROR_CODES } from "@/lib/api/errors";
import { describe, expect, it, vi } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    delete: (...args: unknown[]) => mockDelete(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

vi.mock("@/lib/db/schema/short-link", () => ({
  shortLinksTable: {
    customSlug: "custom_slug",
    id: "id",
    slug: "slug",
    userId: "user_id",
  },
}));

vi.mock("@/lib/db/schema/short-slug", () => ({
  shortSlugsTable: { slug: "slug", userId: "user_id" },
}));

vi.mock("@/lib/utils/short-slug", () => ({
  generateUniqueShortSlug: vi.fn().mockResolvedValue("abc23"),
}));

vi.mock("@/lib/utils/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("$2a$10$hashed"),
}));

vi.mock("@/lib/utils/url", () => ({
  ensureProtocol: vi.fn((url: string) => (url.startsWith("http") ? url : `https://${url}`)),
  isSafeUrl: vi.fn().mockReturnValue(true),
  urlResolves: vi.fn().mockResolvedValue(true),
}));

const TEST_SHORT_DOMAIN = "test.short.domain";

vi.mock("@/lib/constants/short-domain", () => ({
  shortDomainUrl: vi.fn((slug: string) => `https://${TEST_SHORT_DOMAIN}/${slug}`),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { isSafeUrl, urlResolves } = await import("@/lib/utils/url");

const PRO_USER: ApiKeyUser = { id: "user-1", tier: "pro", username: "prouser" };
const FREE_USER: ApiKeyUser = { id: "user-2", tier: "free", username: "freeuser" };

const MOCK_SHORT_LINK = {
  createdAt: new Date("2026-01-01"),
  customSlug: null,
  expiresAt: null,
  id: "sl-1",
  passwordHash: null,
  slug: "abc23",
  url: "https://example.com",
  userId: "user-1",
};

function setupSelectReturning(rows: unknown[]) {
  mockSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(rows),
      }),
    }),
  });
}

/**
 * createShortLink with a customSlug now runs TWO selects in order:
 *   1. users row (for shortDomain + shortDomainVerified gating)
 *   2. short_links row (for uniqueness check)
 * Queue both mock returns. Pass `verifiedShortDomain: false` to skip step 1.
 */
function setupCustomSlugPath(params: { existing?: boolean; verifiedShortDomain: boolean }) {
  const userRow = params.verifiedShortDomain
    ? { shortDomain: "go.example.com", shortDomainVerified: true }
    : { shortDomain: null, shortDomainVerified: false };
  mockSelect.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([userRow]),
      }),
    }),
  });
  if (params.verifiedShortDomain) {
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(params.existing ? [{ id: "existing-id" }] : []),
        }),
      }),
    });
  }
}

function setupInsertSuccess(returnRow: unknown) {
  // neon-http has no transactions — createShortLink stages the rows in three
  // steps to avoid the circular FK between short_slugs and short_links:
  //   1. INSERT short_slugs (tombstoned=true)
  //   2. INSERT short_links ... RETURNING *
  //   3. UPDATE short_slugs SET short_link_id=..., tombstoned=false
  mockInsert.mockReturnValueOnce({
    values: vi.fn().mockResolvedValue(undefined),
  });
  mockInsert.mockReturnValueOnce({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([returnRow]),
    }),
  });
  mockUpdate.mockReturnValueOnce({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });
}

function setupInsertFailure(error: Error) {
  // Step 1 (short_slugs insert) succeeds, step 2 (short_links insert) throws.
  // Cleanup deletes the orphaned slug row.
  mockInsert.mockReturnValueOnce({
    values: vi.fn().mockResolvedValue(undefined),
  });
  mockInsert.mockReturnValueOnce({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockRejectedValue(error),
    }),
  });
  mockDelete.mockReturnValueOnce({
    where: vi.fn().mockResolvedValue(undefined),
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("createShortLink", () => {
  it("creates a short link with valid input", async () => {
    //* Arrange
    setupInsertSuccess(MOCK_SHORT_LINK);
    const { createShortLink } = await import("./short-link");

    //* Act
    const result = await createShortLink(PRO_USER, { url: "https://example.com" });

    //* Assert
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data?.slug).toBe("abc23");
    expect(result.data?.shortUrl).toBe(`https://${TEST_SHORT_DOMAIN}/abc23`);
  });

  it("rolls back the short_slugs insert if the short_links insert fails", async () => {
    //* Arrange
    setupInsertFailure(new Error("duplicate key"));
    const { createShortLink } = await import("./short-link");

    //* Act
    const promise = createShortLink(PRO_USER, { url: "https://example.com" });

    //* Assert
    await expect(promise).rejects.toThrow("duplicate key");
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it("rejects unsafe URLs", async () => {
    //* Arrange
    vi.mocked(isSafeUrl).mockReturnValueOnce(false);
    const { createShortLink } = await import("./short-link");

    //* Act
    const result = await createShortLink(PRO_USER, { url: "javascript:alert(1)" });

    //* Assert
    expect(result.error?.code).toBe(API_ERROR_CODES.UNSAFE_URL);
  });

  it("rejects unreachable URLs", async () => {
    //* Arrange
    vi.mocked(urlResolves).mockResolvedValueOnce(false);
    const { createShortLink } = await import("./short-link");

    //* Act
    const result = await createShortLink(PRO_USER, { url: "https://nonexistent.example" });

    //* Assert
    expect(result.error?.code).toBe(API_ERROR_CODES.URL_UNREACHABLE);
  });

  it("rejects custom slug for free users", async () => {
    //* Arrange
    const { createShortLink } = await import("./short-link");

    //* Act
    const result = await createShortLink(FREE_USER, { customSlug: "my-slug", url: "https://example.com" });

    //* Assert
    expect(result.error?.code).toBe(API_ERROR_CODES.PRO_REQUIRED);
  });

  it("rejects password for free users", async () => {
    //* Arrange
    const { createShortLink } = await import("./short-link");

    //* Act
    const result = await createShortLink(FREE_USER, { password: "secret", url: "https://example.com" });

    //* Assert
    expect(result.error?.code).toBe(API_ERROR_CODES.PRO_REQUIRED);
  });

  it("rejects duplicate custom slug", async () => {
    //* Arrange — Pro user with a verified short domain, so the customSlug gate
    //  passes the first select; second select returns an existing row (conflict).
    setupCustomSlugPath({ existing: true, verifiedShortDomain: true });
    const { createShortLink } = await import("./short-link");

    //* Act
    const result = await createShortLink(PRO_USER, { customSlug: "taken", url: "https://example.com" });

    //* Assert
    expect(result.error?.code).toBe(API_ERROR_CODES.PATH_ALREADY_IN_USE);
  });

  it("rejects customSlug when user has no verified short_domain", async () => {
    //* Arrange — Pro user who hasn't configured a verified short domain yet.
    //  Custom slugs are only resolvable via the custom-short-domain middleware
    //  path; accepting one would store data that nothing resolves against.
    setupCustomSlugPath({ verifiedShortDomain: false });
    const { createShortLink } = await import("./short-link");

    //* Act
    const result = await createShortLink(PRO_USER, { customSlug: "my-slug", url: "https://example.com" });

    //* Assert
    expect(result.error?.code).toBe(API_ERROR_CODES.VALIDATION_ERROR);
  });
});

describe("getShortLink", () => {
  it("returns a short link by id", async () => {
    //* Arrange
    setupSelectReturning([MOCK_SHORT_LINK]);
    const { getShortLink } = await import("./short-link");

    //* Act
    const result = await getShortLink(PRO_USER, "sl-1");

    //* Assert
    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("sl-1");
  });

  it("returns NOT_FOUND for missing short link", async () => {
    //* Arrange
    setupSelectReturning([]);
    const { getShortLink } = await import("./short-link");

    //* Act
    const result = await getShortLink(PRO_USER, "nonexistent");

    //* Assert
    expect(result.error?.code).toBe(API_ERROR_CODES.NOT_FOUND);
  });
});

describe("deleteShortLink", () => {
  it("returns NOT_FOUND for missing short link", async () => {
    //* Arrange
    setupSelectReturning([]);
    const { deleteShortLink } = await import("./short-link");

    //* Act
    const result = await deleteShortLink(PRO_USER, "nonexistent");

    //* Assert
    expect(result.error?.code).toBe(API_ERROR_CODES.NOT_FOUND);
  });
});

describe("updateShortLink", () => {
  it("returns NOT_FOUND for missing short link", async () => {
    //* Arrange
    setupSelectReturning([]);
    const { updateShortLink } = await import("./short-link");

    //* Act
    const result = await updateShortLink(PRO_USER, "nonexistent", { url: "https://new.com" });

    //* Assert
    expect(result.error?.code).toBe(API_ERROR_CODES.NOT_FOUND);
  });

  it("returns unchanged link when no updates provided", async () => {
    //* Arrange
    setupSelectReturning([MOCK_SHORT_LINK]);
    const { updateShortLink } = await import("./short-link");

    //* Act
    const result = await updateShortLink(PRO_USER, "sl-1", {});

    //* Assert
    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("sl-1");
  });

  it("rejects custom slug update for free users", async () => {
    //* Arrange
    setupSelectReturning([MOCK_SHORT_LINK]);
    const { updateShortLink } = await import("./short-link");

    //* Act
    const result = await updateShortLink(FREE_USER, "sl-1", { customSlug: "my-slug" });

    //* Assert
    expect(result.error?.code).toBe(API_ERROR_CODES.PRO_REQUIRED);
  });

  it("rejects password update for free users", async () => {
    //* Arrange
    setupSelectReturning([MOCK_SHORT_LINK]);
    const { updateShortLink } = await import("./short-link");

    //* Act
    const result = await updateShortLink(FREE_USER, "sl-1", { password: "secret" });

    //* Assert
    expect(result.error?.code).toBe(API_ERROR_CODES.PRO_REQUIRED);
  });
});
