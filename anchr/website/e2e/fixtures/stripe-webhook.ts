import { createHmac } from "node:crypto";

/**
 * Build a Stripe-compatible webhook signature header for a given JSON
 * payload. This mirrors the format that `stripe.webhooks.constructEvent`
 * verifies: `t=<unix-seconds>,v1=<hmac-sha256-hex>` where the HMAC input is
 * `<timestamp>.<payload>`.
 *
 * Used by the signed-webhook e2e test to prove the live route (not just the
 * unit-level mocks) accepts real signatures, rejects invalid ones, and
 * writes the expected DB state end-to-end.
 */
export function signStripePayload(payload: string, secret: string, timestamp?: number): string {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const signedPayload = `${ts}.${payload}`;
  const v1 = createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${ts},v1=${v1}`;
}

/**
 * Build a synthetic `checkout.session.completed` event payload pointing at a
 * specific user. The event id is randomized so repeated deliveries in the
 * same test run don't collide in any (hypothetical) future dedup store.
 */
export function buildCheckoutCompletedPayload(options: {
  clerkUserId: string;
  customerId?: string;
  subscriptionId?: string;
}): string {
  return JSON.stringify({
    data: {
      object: {
        client_reference_id: options.clerkUserId,
        customer: options.customerId ?? "cus_e2e_signed",
        id: `cs_test_${randomHex(24)}`,
        subscription: options.subscriptionId ?? "sub_e2e_signed",
      },
    },
    id: `evt_e2e_${randomHex(20)}`,
    object: "event",
    type: "checkout.session.completed",
  });
}

/**
 * Build a synthetic `customer.subscription.deleted` event payload pointing
 * at a specific Stripe customer id. Used to prove the live downgrade path.
 */
export function buildSubscriptionDeletedPayload(options: { customerId: string }): string {
  return JSON.stringify({
    data: {
      object: {
        customer: options.customerId,
        id: `sub_test_${randomHex(24)}`,
        object: "subscription",
        status: "canceled",
      },
    },
    id: `evt_e2e_${randomHex(20)}`,
    object: "event",
    type: "customer.subscription.deleted",
  });
}

function randomHex(length: number): string {
  let out = "";
  const hex = "0123456789abcdef";
  for (let i = 0; i < length; i++) {
    out += hex[Math.floor(Math.random() * 16)];
  }
  return out;
}
