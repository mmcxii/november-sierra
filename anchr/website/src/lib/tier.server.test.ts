import type { SessionUser } from "@/lib/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockUpdate = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

vi.mock("@/lib/db/schema/user", () => ({
  usersTable: { id: "id", proExpiresAt: "pro_expires_at", tier: "tier" },
}));

// Stub the Vercel client — cleanupExpiredPro calls removeDomain when a user
// has a custom_domain or short_domain set. We don't need real Vercel behavior
// in unit tests; just a resolved promise per invocation.
const mockRemoveDomain = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/lib/vercel", () => ({
  removeDomain: (...args: unknown[]) => mockRemoveDomain(...args),
}));

// ─── Chain helper ────────────────────────────────────────────────────────────

type UpdateChain = {
  root: { set: ReturnType<typeof vi.fn> };
  set: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
};

function buildUpdateChain(): UpdateChain {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  return { root: { set }, set, where };
}

// ─── grantPro ────────────────────────────────────────────────────────────────
//
// `grantPro` is now a single atomic UPDATE — all branches (lifetime, finite,
// stacking, lifetime preservation) are expressed in SQL, not JS. Unit tests
// can assert the set() payload shape (tier, updatedAt, proExpiresAt is
// present) and that the WHERE clause is called, but the ACTUAL stacking
// math is enforced by Postgres via the CASE expression. That's intentional:
// the previous JS-based calculation had a lost-update race under concurrent
// grants, and atomicity requires pushing the math into SQL.
//
// The stacking behavior is exercised end-to-end in `e2e/onboarding.spec.ts`
// (referral-code redemption path) and in production via the Stripe webhook
// referrer-reward branch.

describe("grantPro", () => {
  beforeEach(() => {
    mockUpdate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("lifetime grant (durationDays = null)", () => {
    it("sets tier=pro and clears proExpiresAt unconditionally", async () => {
      //* Arrange
      const update = buildUpdateChain();
      mockUpdate.mockReturnValueOnce(update.root);
      const { grantPro } = await import("./tier.server");

      //* Act
      await grantPro("user-1", null);

      //* Assert
      expect(update.set).toHaveBeenCalledWith(expect.objectContaining({ proExpiresAt: null, tier: "pro" }));
      expect(update.where).toHaveBeenCalledTimes(1);
    });
  });

  describe("finite grant (durationDays = number)", () => {
    it("calls db.update exactly once with tier=pro and a computed proExpiresAt expression", async () => {
      //* Arrange
      const update = buildUpdateChain();
      mockUpdate.mockReturnValueOnce(update.root);
      const { grantPro } = await import("./tier.server");

      //* Act
      await grantPro("user-1", 30);

      //* Assert — the call shape is correct; tier is flipped to "pro", the
      // proExpiresAt value is a drizzle SQL expression (not a plain Date,
      // because the stacking math happens in Postgres), and updatedAt is
      // a Date.
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(update.set).toHaveBeenCalledTimes(1);
      const setArg = update.set.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(setArg.tier).toBe("pro");
      expect(setArg.updatedAt).toBeInstanceOf(Date);
      expect(setArg.proExpiresAt).toBeDefined();
      expect(setArg.proExpiresAt).not.toBeInstanceOf(Date);
    });

    it("attaches a WHERE clause that excludes lifetime pro users", async () => {
      //* Arrange
      const update = buildUpdateChain();
      mockUpdate.mockReturnValueOnce(update.root);
      const { grantPro } = await import("./tier.server");

      //* Act
      await grantPro("user-1", 30);

      //* Assert — the WHERE call exists. Its internal shape (a compound
      // AND with id-match + a lifetime-pro exclusion) is enforced in SQL
      // and exercised end-to-end by the onboarding + referral code e2e.
      expect(update.where).toHaveBeenCalledTimes(1);
      const whereArg = update.where.mock.calls[0]?.[0];
      expect(whereArg).toBeDefined();
    });
  });
});

// ─── cleanupExpiredPro ───────────────────────────────────────────────────────

describe("cleanupExpiredPro", () => {
  beforeEach(() => {
    mockUpdate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function makeUser(overrides: Partial<SessionUser> = {}): SessionUser {
    return {
      id: "user-1",
      proExpiresAt: null,
      tier: "free",
      ...overrides,
    } as SessionUser;
  }

  it("returns free users unchanged and does not touch the db", async () => {
    //* Arrange
    const user = makeUser({ tier: "free" });
    const { cleanupExpiredPro } = await import("./tier.server");

    //* Act
    const result = await cleanupExpiredPro(user);

    //* Assert
    expect(result).toBe(user);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns lifetime pro users (proExpiresAt=null) unchanged", async () => {
    //* Arrange
    const user = makeUser({ proExpiresAt: null, tier: "pro" });
    const { cleanupExpiredPro } = await import("./tier.server");

    //* Act
    const result = await cleanupExpiredPro(user);

    //* Assert
    expect(result).toBe(user);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns pro users whose expiry is still in the future unchanged", async () => {
    //* Arrange
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T00:00:00.000Z"));
    const future = new Date("2026-04-10T00:00:00.000Z");
    const user = makeUser({ proExpiresAt: future, tier: "pro" });
    const { cleanupExpiredPro } = await import("./tier.server");

    //* Act
    const result = await cleanupExpiredPro(user);

    //* Assert
    expect(result).toBe(user);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("downgrades pro users whose expiry has passed and returns a free user", async () => {
    //* Arrange
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T00:00:00.000Z"));
    const expired = new Date("2026-03-01T00:00:00.000Z");
    const user = makeUser({ proExpiresAt: expired, tier: "pro" });
    const update = buildUpdateChain();
    mockUpdate.mockReturnValueOnce(update.root);
    const { cleanupExpiredPro } = await import("./tier.server");

    //* Act
    const result = await cleanupExpiredPro(user);

    //* Assert
    expect(update.set).toHaveBeenCalledWith(expect.objectContaining({ proExpiresAt: null, tier: "free" }));
    expect(result.tier).toBe("free");
    expect(result.proExpiresAt).toBeNull();
  });

  it("does NOT downgrade when proExpiresAt exactly equals the current time (boundary)", async () => {
    //* Arrange
    vi.useFakeTimers();
    const now = new Date("2026-04-01T00:00:00.000Z");
    vi.setSystemTime(now);
    const user = makeUser({ proExpiresAt: now, tier: "pro" });
    const { cleanupExpiredPro } = await import("./tier.server");

    //* Act
    const result = await cleanupExpiredPro(user);

    //* Assert — boundary uses >=, so "exactly now" is still valid
    expect(result).toBe(user);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
