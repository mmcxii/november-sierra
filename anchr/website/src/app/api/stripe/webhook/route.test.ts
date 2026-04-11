import type Stripe from "stripe";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockConstructEvent = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockEnsureQuickLinksGroup = vi.fn();
const mockRemoveDomain = vi.fn();
const mockGrantPro = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  },
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

vi.mock("@/lib/db/schema/user", () => ({
  usersTable: {
    customDomain: "custom_domain",
    id: "id",
    proExpiresAt: "pro_expires_at",
    stripeCustomerId: "stripe_customer_id",
  },
}));

vi.mock("@/lib/db/queries/quick-links", () => ({
  ensureQuickLinksGroup: (...args: unknown[]) => mockEnsureQuickLinksGroup(...args),
}));

vi.mock("@/lib/vercel", () => ({
  removeDomain: (...args: unknown[]) => mockRemoveDomain(...args),
}));

vi.mock("@/lib/tier.server", () => ({
  grantPro: (...args: unknown[]) => mockGrantPro(...args),
}));

const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ─── Chain helpers ───────────────────────────────────────────────────────────
//
// The drizzle chains used by the webhook route come in three shapes:
//   • `db.update(t).set(v).where(c)`                        — awaited, no return
//   • `db.update(t).set(v).where(c).returning({...})`       — awaited, returns rows
//   • `db.select({...}).from(t).where(c).limit(n)`          — awaited, returns rows
// Instead of a thenable-chain trick, each helper builds the exact nested
// spy shape. Tests grab the `set` / `where` spies to assert arguments and
// wire the root object into `mockUpdate.mockReturnValueOnce()`.

type UpdateChain = {
  returning: ReturnType<typeof vi.fn>;
  root: { set: ReturnType<typeof vi.fn> };
  set: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
};

function buildUpdateChain(returningValue: unknown[] = []): UpdateChain {
  const returning = vi.fn().mockResolvedValue(returningValue);
  // `where` returns a Promise<undefined> so `await db.update().set().where()`
  // resolves cleanly; it also exposes `.returning()` so the destructured form
  // `const [row] = await ....returning({...})` still works.
  const wherePromise = Promise.resolve(undefined) as Promise<undefined> & {
    returning: typeof returning;
  };
  wherePromise.returning = returning;
  const where = vi.fn().mockReturnValue(wherePromise);
  const set = vi.fn().mockReturnValue({ where });
  return { returning, root: { set }, set, where };
}

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

function buildRequest(body = "payload", signature: null | string = "sig_test"): Request {
  const headers: Record<string, string> = {};
  if (signature != null) {
    headers["stripe-signature"] = signature;
  }
  return new Request("http://localhost/api/stripe/webhook", {
    body,
    headers,
    method: "POST",
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    // Use mockReset (not mockClear) to drain any pending mockReturnValueOnce
    // queues from prior tests. clearAllMocks only wipes call history, so any
    // unconsumed `.mockReturnValueOnce(...)` return values leak forward and
    // return the wrong chain object in the next test.
    mockConstructEvent.mockReset();
    mockUpdate.mockReset();
    mockSelect.mockReset();
    mockEnsureQuickLinksGroup.mockReset().mockResolvedValue(undefined);
    mockRemoveDomain.mockReset().mockResolvedValue(undefined);
    mockGrantPro.mockReset().mockResolvedValue(undefined);
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
  });

  afterAll(() => {
    if (originalWebhookSecret == null) {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
    }
  });

  describe("signature verification", () => {
    it("returns 400 when the stripe-signature header is missing", async () => {
      //* Arrange
      const { POST } = await import("./route");
      const req = buildRequest("body", null);

      //* Act
      const res = await POST(req);

      //* Assert
      expect(res.status).toBe(400);
      expect(mockConstructEvent).not.toHaveBeenCalled();
    });

    it("returns 400 when STRIPE_WEBHOOK_SECRET is not configured", async () => {
      //* Arrange
      delete process.env.STRIPE_WEBHOOK_SECRET;
      const { POST } = await import("./route");
      const req = buildRequest();

      //* Act
      const res = await POST(req);

      //* Assert
      expect(res.status).toBe(400);
      expect(mockConstructEvent).not.toHaveBeenCalled();
    });

    it("returns 400 when Stripe signature verification throws", async () => {
      //* Arrange
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockConstructEvent.mockImplementation(() => {
        throw new Error("bad signature");
      });
      const { POST } = await import("./route");
      const req = buildRequest();

      //* Act
      const res = await POST(req);

      //* Assert
      expect(res.status).toBe(400);
      expect(mockUpdate).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe("checkout.session.completed", () => {
    function emitCompleted(
      overrides: Partial<Stripe.Checkout.Session> = {},
      referredBy: null | string = null,
    ): { clearReferrer: UpdateChain; proUpdate: UpdateChain; referredSelect: SelectChain } {
      mockConstructEvent.mockReturnValue({
        data: {
          object: {
            client_reference_id: "user-123",
            customer: "cus_test_1",
            subscription: "sub_test_1",
            ...overrides,
          } as Stripe.Checkout.Session,
        },
        type: "checkout.session.completed",
      } as Stripe.Event);

      const proUpdate = buildUpdateChain();
      const clearReferrer = buildUpdateChain();
      mockUpdate.mockReturnValueOnce(proUpdate.root).mockReturnValueOnce(clearReferrer.root);

      const referredSelect = buildSelectChain([{ referredBy }]);
      mockSelect.mockReturnValueOnce(referredSelect.root);

      return { clearReferrer, proUpdate, referredSelect };
    }

    it("upgrades the user to pro and records stripe ids", async () => {
      //* Arrange
      const { proUpdate } = emitCompleted();
      const { POST } = await import("./route");

      //* Act
      const res = await POST(buildRequest());

      //* Assert
      expect(res.status).toBe(200);
      expect(proUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          proExpiresAt: null,
          stripeCustomerId: "cus_test_1",
          stripeSubscriptionId: "sub_test_1",
          tier: "pro",
        }),
      );
      expect(mockEnsureQuickLinksGroup).toHaveBeenCalledWith("user-123");
    });

    it("is a no-op when client_reference_id is null", async () => {
      //* Arrange
      mockConstructEvent.mockReturnValue({
        data: { object: { client_reference_id: null } as unknown as Stripe.Checkout.Session },
        type: "checkout.session.completed",
      } as Stripe.Event);
      const { POST } = await import("./route");

      //* Act
      const res = await POST(buildRequest());

      //* Assert
      expect(res.status).toBe(200);
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockEnsureQuickLinksGroup).not.toHaveBeenCalled();
    });

    it("grants the referrer 30 days of pro when user was referred, then clears referredBy", async () => {
      //* Arrange
      const { clearReferrer } = emitCompleted({}, "referrer-user-id");
      const { POST } = await import("./route");

      //* Act
      await POST(buildRequest());

      //* Assert
      expect(mockGrantPro).toHaveBeenCalledWith("referrer-user-id", 30);
      expect(clearReferrer.set).toHaveBeenCalledWith(expect.objectContaining({ referredBy: null }));
    });

    it("does not grant a referrer reward when user has no referredBy", async () => {
      //* Arrange
      emitCompleted({}, null);
      const { POST } = await import("./route");

      //* Act
      await POST(buildRequest());

      //* Assert
      expect(mockGrantPro).not.toHaveBeenCalled();
    });

    it("is idempotent across duplicate deliveries: referrer reward only granted once", async () => {
      // Stripe guarantees at-least-once delivery, so the same event.id can
      // arrive twice. The route's safety comes from clearing `referredBy`
      // after the first grant — the second delivery reads null and skips
      // grantPro. This test proves that behavior explicitly.

      //* Arrange — set up the event twice with fresh chain mocks each call
      mockConstructEvent.mockReturnValue({
        data: {
          object: {
            client_reference_id: "user-123",
            customer: "cus_test_1",
            subscription: "sub_test_1",
          } as Stripe.Checkout.Session,
        },
        type: "checkout.session.completed",
      } as Stripe.Event);

      // First delivery: proUpdate → select(referredBy=referrer-1) → clearReferrer
      mockUpdate
        .mockReturnValueOnce(buildUpdateChain().root)
        .mockReturnValueOnce(buildUpdateChain().root)
        // Second delivery: proUpdate (no clearReferrer because referredBy is null)
        .mockReturnValueOnce(buildUpdateChain().root);
      mockSelect
        .mockReturnValueOnce(buildSelectChain([{ referredBy: "referrer-1" }]).root)
        .mockReturnValueOnce(buildSelectChain([{ referredBy: null }]).root);

      const { POST } = await import("./route");

      //* Act — deliver the same event twice
      const res1 = await POST(buildRequest());
      const res2 = await POST(buildRequest());

      //* Assert — both succeed, grantPro called exactly once across both deliveries
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(mockGrantPro).toHaveBeenCalledTimes(1);
      expect(mockGrantPro).toHaveBeenCalledWith("referrer-1", 30);
    });
  });

  describe("customer.subscription.updated", () => {
    function emitUpdated(status: Stripe.Subscription.Status) {
      mockConstructEvent.mockReturnValue({
        data: {
          object: {
            customer: "cus_test_1",
            status,
          } as Stripe.Subscription,
        },
        type: "customer.subscription.updated",
      } as Stripe.Event);
    }

    it("upgrades to pro and ensures quick-links group when status is active", async () => {
      //* Arrange
      emitUpdated("active");
      const activeUpdate = buildUpdateChain([{ id: "user-42" }]);
      mockUpdate.mockReturnValueOnce(activeUpdate.root);
      const { POST } = await import("./route");

      //* Act
      const res = await POST(buildRequest());

      //* Assert
      expect(res.status).toBe(200);
      expect(activeUpdate.set).toHaveBeenCalledWith(expect.objectContaining({ tier: "pro" }));
      expect(mockEnsureQuickLinksGroup).toHaveBeenCalledWith("user-42");
    });

    it("does not call ensureQuickLinksGroup when active update finds no matching user", async () => {
      //* Arrange
      emitUpdated("active");
      mockUpdate.mockReturnValueOnce(buildUpdateChain([]).root);
      const { POST } = await import("./route");

      //* Act
      await POST(buildRequest());

      //* Assert
      expect(mockEnsureQuickLinksGroup).not.toHaveBeenCalled();
    });

    it.each(["canceled", "past_due", "unpaid"] as const)("downgrades the user when status is %s", async (status) => {
      //* Arrange
      emitUpdated(status);
      mockSelect.mockReturnValueOnce(
        buildSelectChain([{ customDomain: null, id: "user-99", proExpiresAt: null }]).root,
      );
      const downgradeUpdate = buildUpdateChain();
      mockUpdate.mockReturnValueOnce(downgradeUpdate.root);
      const { POST } = await import("./route");

      //* Act
      const res = await POST(buildRequest());

      //* Assert
      expect(res.status).toBe(200);
      expect(downgradeUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          customDomain: null,
          customDomainVerified: false,
          proExpiresAt: null,
          stripeSubscriptionId: null,
          tier: "free",
        }),
      );
    });

    it("is a no-op when subscription status is trialing", async () => {
      //* Arrange
      emitUpdated("trialing");
      const { POST } = await import("./route");

      //* Act
      const res = await POST(buildRequest());

      //* Assert
      expect(res.status).toBe(200);
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockSelect).not.toHaveBeenCalled();
    });
  });

  describe("customer.subscription.deleted — handleDowngrade semantics", () => {
    function emitDeleted() {
      mockConstructEvent.mockReturnValue({
        data: {
          object: {
            customer: "cus_test_1",
            status: "canceled",
          } as Stripe.Subscription,
        },
        type: "customer.subscription.deleted",
      } as Stripe.Event);
    }

    it("clears tier, subscription, and custom domain fields, and calls removeDomain", async () => {
      //* Arrange
      emitDeleted();
      mockSelect.mockReturnValueOnce(
        buildSelectChain([{ customDomain: "example.com", id: "user-1", proExpiresAt: null }]).root,
      );
      const downgradeUpdate = buildUpdateChain();
      mockUpdate.mockReturnValueOnce(downgradeUpdate.root);
      const { POST } = await import("./route");

      //* Act
      const res = await POST(buildRequest());

      //* Assert
      expect(res.status).toBe(200);
      expect(mockRemoveDomain).toHaveBeenCalledWith("example.com");
      expect(downgradeUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          customDomain: null,
          customDomainVerified: false,
          proExpiresAt: null,
          stripeSubscriptionId: null,
          tier: "free",
        }),
      );
    });

    it("preserves tier and proExpiresAt when user still has referral pro remaining", async () => {
      //* Arrange
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      emitDeleted();
      mockSelect.mockReturnValueOnce(
        buildSelectChain([{ customDomain: null, id: "user-1", proExpiresAt: future }]).root,
      );
      const downgradeUpdate = buildUpdateChain();
      mockUpdate.mockReturnValueOnce(downgradeUpdate.root);
      const { POST } = await import("./route");

      //* Act
      await POST(buildRequest());

      //* Assert — tier + proExpiresAt should NOT be in the set payload
      const setArg = downgradeUpdate.set.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(setArg).not.toHaveProperty("tier");
      expect(setArg).not.toHaveProperty("proExpiresAt");
      expect(setArg).toHaveProperty("stripeSubscriptionId", null);
      expect(setArg).toHaveProperty("customDomain", null);
    });

    it("does nothing when no user matches the customer id", async () => {
      //* Arrange
      emitDeleted();
      mockSelect.mockReturnValueOnce(buildSelectChain([]).root);
      const { POST } = await import("./route");

      //* Act
      const res = await POST(buildRequest());

      //* Assert
      expect(res.status).toBe(200);
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockRemoveDomain).not.toHaveBeenCalled();
    });

    it("still clears db fields when removeDomain throws", async () => {
      //* Arrange
      emitDeleted();
      mockSelect.mockReturnValueOnce(
        buildSelectChain([{ customDomain: "broken.example.com", id: "user-1", proExpiresAt: null }]).root,
      );
      const downgradeUpdate = buildUpdateChain();
      mockUpdate.mockReturnValueOnce(downgradeUpdate.root);
      mockRemoveDomain.mockRejectedValueOnce(new Error("vercel is down"));
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const { POST } = await import("./route");

      //* Act
      const res = await POST(buildRequest());

      //* Assert
      expect(res.status).toBe(200);
      expect(downgradeUpdate.set).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe("unknown events", () => {
    it("returns 200 without touching the database", async () => {
      //* Arrange
      mockConstructEvent.mockReturnValue({
        data: { object: {} },
        type: "invoice.paid",
      } as Stripe.Event);
      const { POST } = await import("./route");

      //* Act
      const res = await POST(buildRequest());

      //* Assert
      expect(res.status).toBe(200);
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockSelect).not.toHaveBeenCalled();
    });
  });
});
