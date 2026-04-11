import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────
//
// `redeemReferralCode` is the second user-facing entry point into pro (the
// first being Stripe checkout). It has 9 distinct failure branches and 4
// success variants, none of which were tested prior to this file. We mock
// the db chain + grantPro + auth and drive each branch explicitly.

const mockAuth = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockGrantPro = vi.fn();
const mockIsAdmin = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

vi.mock("@/lib/db/schema/user", () => ({
  usersTable: { displayName: "display_name", id: "id", username: "username" },
}));
vi.mock("@/lib/db/schema/referral-code", () => ({
  referralCodesTable: {
    code: "code",
    currentRedemptions: "current_redemptions",
    id: "id",
  },
}));
vi.mock("@/lib/db/schema/referral-redemption", () => ({
  referralRedemptionsTable: { codeId: "code_id", id: "id", userId: "user_id" },
}));

vi.mock("@/lib/auth", () => ({
  isAdmin: (...args: unknown[]) => mockIsAdmin(...args),
}));
vi.mock("@/lib/tier.server", () => ({
  grantPro: (...args: unknown[]) => mockGrantPro(...args),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Pull in every other module actions.ts touches so the import doesn't blow up.
vi.mock("@/lib/db/queries/username", () => ({
  checkUsernameAvailability: vi.fn(),
  updateUsername: vi.fn(),
}));
vi.mock("@/lib/env", () => ({
  envSchema: { NEXT_PUBLIC_APP_URL: "https://test.anchr.to", STRIPE_PRO_PRICE_ID: "price_test" },
}));
vi.mock("@/lib/nostr", () => ({ isNpub: vi.fn() }));
vi.mock("@/lib/nostr-profile", () => ({
  DEFAULT_RELAYS: [],
  MAX_RELAYS: 10,
  isValidRelayUrl: vi.fn(),
}));
vi.mock("@/lib/nostr-profile.server", () => ({ fetchNostrProfile: vi.fn() }));
vi.mock("@/lib/services/account-deletion", () => ({
  deleteAccount: vi.fn(),
  getAccountDeletionSummary: vi.fn(),
}));
vi.mock("@/lib/stripe", () => ({
  stripe: {
    billingPortal: { sessions: { create: vi.fn() } },
    checkout: { sessions: { create: vi.fn() } },
  },
}));
vi.mock("@/lib/themes", () => ({ isDarkTheme: vi.fn(), isValidThemeId: vi.fn() }));
vi.mock("@/lib/tier", () => ({ isProUser: vi.fn() }));
vi.mock("@/lib/utils/referral-code", () => ({ generateReferralCode: vi.fn() }));
vi.mock("@/lib/utils/url", () => ({ isValidDomain: vi.fn() }));
vi.mock("@/lib/vercel", () => ({
  addDomain: vi.fn(),
  getDomainConfig: vi.fn(),
  removeDomain: vi.fn(),
  verifyDomain: vi.fn(),
}));

// ─── Chain helpers ───────────────────────────────────────────────────────────

type SelectChain = {
  root: { from: ReturnType<typeof vi.fn> };
};

function buildSelectChain(rows: unknown[]): SelectChain {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  return { root: { from } };
}

type UpdateChain = { root: { set: ReturnType<typeof vi.fn> }; set: ReturnType<typeof vi.fn> };

function buildUpdateChain(): UpdateChain {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  return { root: { set }, set };
}

type InsertChain = { root: { values: ReturnType<typeof vi.fn> } };

function buildInsertChain(): InsertChain {
  const values = vi.fn().mockResolvedValue(undefined);
  return { root: { values } };
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

type ReferralCodeRow = {
  active: boolean;
  code: string;
  creatorId: null | string;
  currentRedemptions: number;
  durationDays: null | number;
  expiresAt: null | Date;
  id: string;
  maxRedemptions: null | number;
  reservedUsername: null | string;
  type: "admin" | "user";
};

function makeCode(overrides: Partial<ReferralCodeRow> = {}): ReferralCodeRow {
  return {
    active: true,
    code: "ANCHR-TEST01",
    creatorId: null,
    currentRedemptions: 0,
    durationDays: 30,
    expiresAt: null,
    id: "code-1",
    maxRedemptions: null,
    reservedUsername: null,
    type: "admin",
    ...overrides,
  };
}

// Queues up the select chain returns in the order the action reads them:
// 1. referralCodesTable lookup
// 2. referralRedemptionsTable existing check
// 3. (optional) users lookup for reserved-username conflict
// 4. (optional) users lookup for current username (if reserved-username claim)
// 5. (optional) users lookup for referrer display name
function queueSelects(options: {
  code?: null | ReferralCodeRow;
  creator?: null | { displayName: null | string; username: string };
  currentUser?: null | { username: string };
  existingRedemption?: boolean;
  reservedUsernameTakenBy?: null | { id: string };
}) {
  const { code, creator, currentUser, existingRedemption, reservedUsernameTakenBy } = options;

  // Every `redeemReferralCode` call starts with the referral-code lookup and
  // the prior-redemption check, so always push those two (even if one will
  // short-circuit before we get to it).
  mockSelect.mockReturnValueOnce(buildSelectChain(code == null ? [] : [code]).root);
  mockSelect.mockReturnValueOnce(buildSelectChain(existingRedemption === true ? [{ id: "red-1" }] : []).root);

  if (code != null && code.reservedUsername != null) {
    mockSelect.mockReturnValueOnce(
      buildSelectChain(reservedUsernameTakenBy == null ? [] : [reservedUsernameTakenBy]).root,
    );
    if (reservedUsernameTakenBy == null) {
      mockSelect.mockReturnValueOnce(buildSelectChain(currentUser == null ? [] : [currentUser]).root);
    }
  }

  if (code != null && code.type === "user" && code.creatorId != null) {
    mockSelect.mockReturnValueOnce(buildSelectChain(creator == null ? [] : [creator]).root);
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("redeemReferralCode", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockSelect.mockReset();
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockGrantPro.mockReset().mockResolvedValue(undefined);
    mockIsAdmin.mockReset().mockReturnValue(false);
  });

  // ─── Failure branches ─────────────────────────────────────────────────────

  it("returns error when unauthenticated", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: null });
    const { redeemReferralCode } = await import("./actions");

    //* Act
    const result = await redeemReferralCode("ANCHR-TEST01");

    //* Assert
    expect(result.success).toBe(false);
    expect(mockGrantPro).not.toHaveBeenCalled();
  });

  it("returns error when the code does not exist", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    queueSelects({ code: null });
    const { redeemReferralCode } = await import("./actions");

    //* Act
    const result = await redeemReferralCode("ANCHR-NOPE");

    //* Assert
    expect(result).toEqual({ error: "invalidReferralCode", success: false });
    expect(mockGrantPro).not.toHaveBeenCalled();
  });

  it("returns error when the code is deactivated", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    queueSelects({ code: makeCode({ active: false }) });
    const { redeemReferralCode } = await import("./actions");

    //* Act
    const result = await redeemReferralCode("ANCHR-TEST01");

    //* Assert
    expect(result).toEqual({ error: "thisReferralCodeIsNoLongerActive", success: false });
    expect(mockGrantPro).not.toHaveBeenCalled();
  });

  it("returns error when the code has passed its expiry", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    queueSelects({ code: makeCode({ expiresAt: yesterday }) });
    const { redeemReferralCode } = await import("./actions");

    //* Act
    const result = await redeemReferralCode("ANCHR-TEST01");

    //* Assert
    expect(result).toEqual({ error: "thisReferralCodeHasExpired", success: false });
    expect(mockGrantPro).not.toHaveBeenCalled();
  });

  it("blocks non-admin users from redeeming their own code", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockIsAdmin.mockReturnValue(false);
    queueSelects({ code: makeCode({ creatorId: "user-1", type: "user" }) });
    const { redeemReferralCode } = await import("./actions");

    //* Act
    const result = await redeemReferralCode("ANCHR-TEST01");

    //* Assert
    expect(result).toEqual({ error: "youCannotRedeemYourOwnReferralCode", success: false });
    expect(mockGrantPro).not.toHaveBeenCalled();
  });

  it("allows admins to redeem their own code", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "admin-1" });
    mockIsAdmin.mockReturnValue(true);
    queueSelects({
      code: makeCode({ creatorId: "admin-1", type: "user" }),
      creator: { displayName: "Admin", username: "admin" },
    });
    mockInsert.mockReturnValueOnce(buildInsertChain().root);
    mockUpdate.mockReturnValueOnce(buildUpdateChain().root); // increment counter
    mockUpdate.mockReturnValueOnce(buildUpdateChain().root); // set referredBy
    const { redeemReferralCode } = await import("./actions");

    //* Act
    const result = await redeemReferralCode("ANCHR-TEST01");

    //* Assert
    expect(result.success).toBe(true);
    expect(mockGrantPro).toHaveBeenCalledWith("admin-1", 30);
  });

  it("returns error when max redemptions has been reached", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    queueSelects({ code: makeCode({ currentRedemptions: 5, maxRedemptions: 5 }) });
    const { redeemReferralCode } = await import("./actions");

    //* Act
    const result = await redeemReferralCode("ANCHR-TEST01");

    //* Assert
    expect(result).toEqual({ error: "thisReferralCodeHasAlreadyBeenUsed", success: false });
    expect(mockGrantPro).not.toHaveBeenCalled();
  });

  it("returns error when the user has already redeemed this code", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    queueSelects({ code: makeCode(), existingRedemption: true });
    const { redeemReferralCode } = await import("./actions");

    //* Act
    const result = await redeemReferralCode("ANCHR-TEST01");

    //* Assert
    expect(result).toEqual({ error: "youHaveAlreadyRedeemedThisCode", success: false });
    expect(mockGrantPro).not.toHaveBeenCalled();
  });

  // ─── Success branches ─────────────────────────────────────────────────────

  it("grants pro and does NOT set referredBy for an admin-type code", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    queueSelects({ code: makeCode({ durationDays: 30, type: "admin" }) });
    mockInsert.mockReturnValueOnce(buildInsertChain().root);
    const incrementUpdate = buildUpdateChain();
    mockUpdate.mockReturnValueOnce(incrementUpdate.root);
    const { redeemReferralCode } = await import("./actions");

    //* Act
    const result = await redeemReferralCode("ANCHR-TEST01");

    //* Assert
    expect(result).toEqual({ durationDays: 30, referrerName: null, success: true });
    expect(mockGrantPro).toHaveBeenCalledWith("user-1", 30);
    expect(mockUpdate).toHaveBeenCalledTimes(1); // only the increment; no referredBy set
  });

  it("grants pro AND sets referredBy for a user-type code with a creator", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    queueSelects({
      code: makeCode({ creatorId: "referrer-1", durationDays: 30, type: "user" }),
      creator: { displayName: "Alice", username: "alice" },
    });
    mockInsert.mockReturnValueOnce(buildInsertChain().root);
    const incrementUpdate = buildUpdateChain();
    const referredByUpdate = buildUpdateChain();
    mockUpdate.mockReturnValueOnce(incrementUpdate.root).mockReturnValueOnce(referredByUpdate.root);
    const { redeemReferralCode } = await import("./actions");

    //* Act
    const result = await redeemReferralCode("ANCHR-TEST01");

    //* Assert
    expect(result).toEqual({ durationDays: 30, referrerName: "Alice", success: true });
    expect(mockGrantPro).toHaveBeenCalledWith("user-1", 30);
    expect(referredByUpdate.set).toHaveBeenCalledWith(expect.objectContaining({ referredBy: "referrer-1" }));
  });

  it("falls back to username when the referrer has no display name", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    queueSelects({
      code: makeCode({ creatorId: "referrer-1", type: "user" }),
      creator: { displayName: null, username: "alice" },
    });
    mockInsert.mockReturnValueOnce(buildInsertChain().root);
    mockUpdate.mockReturnValueOnce(buildUpdateChain().root); // increment
    mockUpdate.mockReturnValueOnce(buildUpdateChain().root); // referredBy
    const { redeemReferralCode } = await import("./actions");

    //* Act
    const result = await redeemReferralCode("ANCHR-TEST01");

    //* Assert
    if (result.success) {
      expect(result.referrerName).toBe("alice");
    } else {
      throw new Error("expected success");
    }
  });

  it("grants lifetime pro when the code has durationDays=null", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    queueSelects({ code: makeCode({ durationDays: null, type: "admin" }) });
    mockInsert.mockReturnValueOnce(buildInsertChain().root);
    mockUpdate.mockReturnValueOnce(buildUpdateChain().root);
    const { redeemReferralCode } = await import("./actions");

    //* Act
    const result = await redeemReferralCode("ANCHR-TEST01");

    //* Assert
    expect(mockGrantPro).toHaveBeenCalledWith("user-1", null);
    expect(result).toEqual({ durationDays: null, referrerName: null, success: true });
  });

  // ─── Reserved username handling ───────────────────────────────────────────

  it("claims a reserved username when it is still available", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    queueSelects({
      code: makeCode({ reservedUsername: "captain" }),
      currentUser: { username: "old-name" },
      reservedUsernameTakenBy: null,
    });
    mockInsert.mockReturnValueOnce(buildInsertChain().root);
    const incrementUpdate = buildUpdateChain();
    const usernameUpdate = buildUpdateChain();
    mockUpdate.mockReturnValueOnce(incrementUpdate.root).mockReturnValueOnce(usernameUpdate.root);
    const { redeemReferralCode } = await import("./actions");

    //* Act
    const result = await redeemReferralCode("ANCHR-TEST01");

    //* Assert
    expect(result.success).toBe(true);
    expect(usernameUpdate.set).toHaveBeenCalledWith(expect.objectContaining({ username: "captain" }));
  });

  it("does NOT overwrite username when the reserved username is already taken", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    queueSelects({
      code: makeCode({ reservedUsername: "captain" }),
      reservedUsernameTakenBy: { id: "other-user" },
    });
    mockInsert.mockReturnValueOnce(buildInsertChain().root);
    const incrementUpdate = buildUpdateChain();
    mockUpdate.mockReturnValueOnce(incrementUpdate.root);
    const { redeemReferralCode } = await import("./actions");

    //* Act
    const result = await redeemReferralCode("ANCHR-TEST01");

    //* Assert — pro still granted, but only one update (the increment); no second update for username
    expect(result.success).toBe(true);
    expect(mockGrantPro).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});
