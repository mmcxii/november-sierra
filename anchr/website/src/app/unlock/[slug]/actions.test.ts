import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockLimit = vi.fn();
const mockSelect = vi.fn();

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(
    class {
      limit = (key: string) => mockLimit(key);
    },
    { slidingWindow: (l: number, w: string) => ({ l, w }) },
  ),
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {},
}));

vi.mock("@/lib/env", () => ({
  envSchema: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    UPSTASH_REDIS_REST_TOKEN: "t",
    UPSTASH_REDIS_REST_URL: "u",
  },
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

vi.mock("@/lib/db/schema/short-link", () => ({ shortLinksTable: { id: "id" } }));
vi.mock("@/lib/db/schema/short-slug", () => ({ shortSlugsTable: { slug: "slug" } }));

const mockVerify = vi.fn();
vi.mock("@/lib/utils/password", () => ({
  verifyPassword: (...args: unknown[]) => mockVerify(...args),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("verifyShortLinkPassword rate limiting", () => {
  beforeEach(() => {
    mockLimit.mockReset();
    mockSelect.mockReset();
    mockVerify.mockReset();
  });

  it("returns rateLimited without querying the DB when the limiter blocks the request", async () => {
    //* Arrange — Upstash reports over limit for this slug.
    mockLimit.mockResolvedValueOnce({ success: false });
    const { verifyShortLinkPassword } = await import("./actions");

    //* Act
    const result = await verifyShortLinkPassword("test-slug", "any-password");

    //* Assert — error is rateLimited and the DB was not hit (no fallback leaks).
    expect(result).toEqual({ error: "rateLimited", success: false });
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("passes through to DB lookup when the limiter allows the request", async () => {
    //* Arrange
    mockLimit.mockResolvedValueOnce({ success: true });
    // No slug row → actions returns notFound. The value here doesn't matter;
    // we only want to prove the limiter did NOT short-circuit.
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    const { verifyShortLinkPassword } = await import("./actions");

    //* Act
    const result = await verifyShortLinkPassword("test-slug", "any-password");

    //* Assert — DB was consulted (result is notFound, not rateLimited).
    expect(result).toEqual({ error: "notFound", success: false });
    expect(mockLimit).toHaveBeenCalledWith("unlock:test-slug");
    expect(mockSelect).toHaveBeenCalled();
  });
});
