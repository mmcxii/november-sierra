import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────
//
// Focused tests for the two Stripe-facing actions in `./actions.ts`:
//   • createCheckoutSession (upgrade entry point)
//   • createPortalSession   (manage-billing entry point)
//
// We can't test these through the full settings-content component because
// they're server actions that call Stripe + the database directly. Here we
// mock every external dependency they touch and assert the Stripe call
// arguments and the action return shape.

const mockAuth = vi.fn();
const mockSelect = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();
const mockBillingPortalSessionsCreate = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock("@/lib/db/client", () => ({
  db: { select: (...args: unknown[]) => mockSelect(...args) },
}));

vi.mock("@/lib/db/schema/user", () => ({
  usersTable: { id: "id", stripeCustomerId: "stripe_customer_id" },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    billingPortal: {
      sessions: { create: (...args: unknown[]) => mockBillingPortalSessionsCreate(...args) },
    },
    checkout: {
      sessions: { create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args) },
    },
  },
}));

vi.mock("@/lib/env", () => ({
  envSchema: {
    NEXT_PUBLIC_APP_URL: "https://test.anchr.to",
    STRIPE_PRO_PRICE_ID: "price_test_pro",
  },
}));

// These imports would otherwise trigger the full actions.ts dependency graph.
// Stub everything actions.ts pulls in but doesn't use in the billing paths.
vi.mock("@/lib/auth", () => ({ isAdmin: vi.fn().mockReturnValue(false) }));
vi.mock("@/lib/db/queries/username", () => ({
  checkUsernameAvailability: vi.fn(),
  updateUsername: vi.fn(),
}));
vi.mock("@/lib/db/schema/referral-code", () => ({ referralCodesTable: {} }));
vi.mock("@/lib/db/schema/referral-redemption", () => ({ referralRedemptionsTable: {} }));
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
vi.mock("@/lib/themes", () => ({ isDarkTheme: vi.fn(), isValidThemeId: vi.fn() }));
vi.mock("@/lib/tier", () => ({ isProUser: vi.fn() }));
vi.mock("@/lib/tier.server", () => ({ grantPro: vi.fn() }));
vi.mock("@/lib/utils/referral-code", () => ({ generateReferralCode: vi.fn() }));
vi.mock("@/lib/utils/url", () => ({ isValidDomain: vi.fn() }));
vi.mock("@/lib/vercel", () => ({
  addDomain: vi.fn(),
  getDomainConfig: vi.fn(),
  removeDomain: vi.fn(),
  verifyDomain: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// ─── Helpers ─────────────────────────────────────────────────────────────────

type SelectChain = {
  from: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  root: { from: ReturnType<typeof vi.fn> };
  where: ReturnType<typeof vi.fn>;
};

function buildSelectChain(rows: unknown[]): SelectChain {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  return { from, limit, root: { from }, where };
}

// ─── createCheckoutSession ───────────────────────────────────────────────────

describe("createCheckoutSession", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockSelect.mockReset();
    mockCheckoutSessionsCreate.mockReset();
  });

  it("returns an error when the user is not authenticated", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: null });
    const { createCheckoutSession } = await import("./actions");

    //* Act
    const result = await createCheckoutSession();

    //* Assert
    expect(result.success).toBe(false);
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("returns an error when the user row is missing", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelect.mockReturnValueOnce(buildSelectChain([]).root);
    const { createCheckoutSession } = await import("./actions");

    //* Act
    const result = await createCheckoutSession();

    //* Assert
    expect(result.success).toBe(false);
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("creates a checkout session without a customer arg when stripeCustomerId is null", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelect.mockReturnValueOnce(buildSelectChain([{ stripeCustomerId: null }]).root);
    mockCheckoutSessionsCreate.mockResolvedValueOnce({ url: "https://stripe.test/session_1" });
    const { createCheckoutSession } = await import("./actions");

    //* Act
    const result = await createCheckoutSession();

    //* Assert
    expect(result).toEqual({ success: true, url: "https://stripe.test/session_1" });
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledTimes(1);
    const params = mockCheckoutSessionsCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(params).toMatchObject({
      cancel_url: "https://test.anchr.to/dashboard/settings",
      client_reference_id: "user-1",
      line_items: [{ price: "price_test_pro", quantity: 1 }],
      mode: "subscription",
      success_url: "https://test.anchr.to/dashboard/settings?checkout=success",
    });
    expect(params).not.toHaveProperty("customer");
  });

  it("reuses existing stripeCustomerId when present", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelect.mockReturnValueOnce(buildSelectChain([{ stripeCustomerId: "cus_existing_123" }]).root);
    mockCheckoutSessionsCreate.mockResolvedValueOnce({ url: "https://stripe.test/session_2" });
    const { createCheckoutSession } = await import("./actions");

    //* Act
    await createCheckoutSession();

    //* Assert
    const params = mockCheckoutSessionsCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(params.customer).toBe("cus_existing_123");
  });

  it("returns an error when Stripe returns a session without a url", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelect.mockReturnValueOnce(buildSelectChain([{ stripeCustomerId: null }]).root);
    mockCheckoutSessionsCreate.mockResolvedValueOnce({ url: null });
    const { createCheckoutSession } = await import("./actions");

    //* Act
    const result = await createCheckoutSession();

    //* Assert
    expect(result.success).toBe(false);
  });

  it("returns an error when Stripe throws", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelect.mockReturnValueOnce(buildSelectChain([{ stripeCustomerId: null }]).root);
    mockCheckoutSessionsCreate.mockRejectedValueOnce(new Error("stripe down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { createCheckoutSession } = await import("./actions");

    //* Act
    const result = await createCheckoutSession();

    //* Assert
    expect(result.success).toBe(false);
    consoleError.mockRestore();
  });
});

// ─── createPortalSession ─────────────────────────────────────────────────────

describe("createPortalSession", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockSelect.mockReset();
    mockBillingPortalSessionsCreate.mockReset();
  });

  it("returns an error when the user is not authenticated", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: null });
    const { createPortalSession } = await import("./actions");

    //* Act
    const result = await createPortalSession();

    //* Assert
    expect(result.success).toBe(false);
    expect(mockBillingPortalSessionsCreate).not.toHaveBeenCalled();
  });

  it("returns an error when the user has no stripeCustomerId", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelect.mockReturnValueOnce(buildSelectChain([{ stripeCustomerId: null }]).root);
    const { createPortalSession } = await import("./actions");

    //* Act
    const result = await createPortalSession();

    //* Assert
    expect(result.success).toBe(false);
    expect(mockBillingPortalSessionsCreate).not.toHaveBeenCalled();
  });

  it("creates a portal session with the user's stripe customer and return url", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelect.mockReturnValueOnce(buildSelectChain([{ stripeCustomerId: "cus_portal_42" }]).root);
    mockBillingPortalSessionsCreate.mockResolvedValueOnce({ url: "https://stripe.test/portal_42" });
    const { createPortalSession } = await import("./actions");

    //* Act
    const result = await createPortalSession();

    //* Assert
    expect(result).toEqual({ success: true, url: "https://stripe.test/portal_42" });
    expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith({
      customer: "cus_portal_42",
      return_url: "https://test.anchr.to/dashboard/settings",
    });
  });

  it("returns an error when the Stripe portal call throws", async () => {
    //* Arrange
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockSelect.mockReturnValueOnce(buildSelectChain([{ stripeCustomerId: "cus_portal_42" }]).root);
    mockBillingPortalSessionsCreate.mockRejectedValueOnce(new Error("stripe 500"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { createPortalSession } = await import("./actions");

    //* Act
    const result = await createPortalSession();

    //* Assert
    expect(result.success).toBe(false);
    consoleError.mockRestore();
  });
});
