import type { Locator, Page } from "@playwright/test";

/**
 * Fills out the Stripe-hosted checkout page with Stripe's standard success
 * test card (4242 4242 4242 4242) and submits the form.
 *
 * Stripe's Checkout DOM changes occasionally — this helper is intentionally
 * defensive:
 *
 *   • Prefers role/label locators over CSS classes (stable across visual
 *     refreshes) and lists multiple candidates per field so a single
 *     selector change doesn't break the helper.
 *   • For each card field the helper first tries the top-level page, then
 *     every cross-origin frame attached to it. Stripe Elements historically
 *     embeds card inputs inside a frame from `js.stripe.com`; the current
 *     hosted checkout (2024+) renders them at the top level, but older
 *     deployments and some A/B branches still use the framed form.
 *   • Optional fields (email, name) return silently if absent so the
 *     helper doesn't fail when the Checkout session pre-populated them.
 *   • Per-candidate timeout is short (3s) so failures point at the missing
 *     field, not a generic 30s "nothing found".
 *
 * If Stripe ships a layout change: the fix is usually a new regex in the
 * candidates block for the affected field.
 *
 * References (April 2026):
 *   • https://docs.stripe.com/testing — test card numbers (4242…)
 *   • https://docs.stripe.com/payments/checkout — hosted checkout structure
 *   • `data-testid="hosted-payment-submit-button"` — stable since the 2023
 *     Checkout refresh
 */

const TEST_CARD_NUMBER = "4242424242424242";
const TEST_EXPIRY_MMYY = "12 / 34";
const TEST_CVC = "123";
const PER_CANDIDATE_TIMEOUT_MS = 3_000;

/**
 * The subset of Page/Frame that exposes Playwright's locator API. Both
 * `Page` and `Frame` implement these methods with identical semantics, so
 * the candidate builders below can run against either.
 */
type LocatorRoot = Pick<Page, "getByLabel" | "getByRole" | "locator">;

export type StripeCheckoutFormValues = {
  cardCvc?: string;
  cardExpiry?: string;
  cardNumber?: string;
  email?: string;
  name?: string;
};

export async function fillStripeTestCard(page: Page, values: StripeCheckoutFormValues = {}): Promise<void> {
  const cardNumber = values.cardNumber ?? TEST_CARD_NUMBER;
  const cardExpiry = values.cardExpiry ?? TEST_EXPIRY_MMYY;
  const cardCvc = values.cardCvc ?? TEST_CVC;

  if (values.email != null) {
    await fillOptional(page, values.email, emailCandidates);
  }

  await fillRequired(page, cardNumber, cardNumberCandidates, "card number");
  await fillRequired(page, cardExpiry, cardExpiryCandidates, "card expiry");
  await fillRequired(page, cardCvc, cvcCandidates, "card cvc");

  if (values.name != null) {
    await fillOptional(page, values.name, nameCandidates);
  }

  await clickSubmit(page);
}

// ─── Candidate builders ──────────────────────────────────────────────────────

function emailCandidates(root: LocatorRoot): Locator[] {
  return [
    root.getByLabel(/email/i),
    root.locator("input#email"),
    root.locator('input[name="email"]'),
    root.locator('input[autocomplete="email"]'),
  ];
}

function cardNumberCandidates(root: LocatorRoot): Locator[] {
  return [
    root.getByLabel(/card number/i),
    root.locator("input#cardNumber"),
    root.locator('input[name="cardNumber"]'),
    root.locator('input[name="cardnumber"]'),
    root.locator('input[autocomplete="cc-number"]'),
  ];
}

function cardExpiryCandidates(root: LocatorRoot): Locator[] {
  return [
    root.getByLabel(/expiration|expiry|mm ?\/ ?yy/i),
    root.locator("input#cardExpiry"),
    root.locator('input[name="cardExpiry"]'),
    root.locator('input[name="exp-date"]'),
    root.locator('input[autocomplete="cc-exp"]'),
  ];
}

function cvcCandidates(root: LocatorRoot): Locator[] {
  return [
    root.getByLabel(/cvc|cvv|security code/i),
    root.locator("input#cardCvc"),
    root.locator('input[name="cardCvc"]'),
    root.locator('input[name="cvc"]'),
    root.locator('input[autocomplete="cc-csc"]'),
  ];
}

function nameCandidates(root: LocatorRoot): Locator[] {
  return [
    root.getByLabel(/name on card|cardholder name/i),
    root.locator("input#billingName"),
    root.locator('input[name="billingName"]'),
    root.locator('input[autocomplete="cc-name"]'),
  ];
}

// ─── Fill strategies ─────────────────────────────────────────────────────────

/**
 * Try each candidate at the top level first, then inside every cross-origin
 * frame. Throws if no candidate matches anywhere — use for card fields that
 * MUST be filled.
 */
async function fillRequired(
  page: Page,
  value: string,
  candidatesFor: (root: LocatorRoot) => Locator[],
  fieldLabel: string,
): Promise<void> {
  if (await tryFill(page, value, candidatesFor(page))) {
    return;
  }

  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) {
      continue;
    }
    if (await tryFill(page, value, candidatesFor(frame))) {
      return;
    }
  }

  throw new Error(`[fillStripeTestCard] could not find the ${fieldLabel} input on the hosted checkout page`);
}

/**
 * Best-effort fill for optional fields. Returns silently if no candidate
 * matches.
 */
async function fillOptional(page: Page, value: string, candidatesFor: (root: LocatorRoot) => Locator[]): Promise<void> {
  if (await tryFill(page, value, candidatesFor(page))) {
    return;
  }
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) {
      continue;
    }
    if (await tryFill(page, value, candidatesFor(frame))) {
      return;
    }
  }
}

async function tryFill(_page: Page, value: string, candidates: Locator[]): Promise<boolean> {
  for (const candidate of candidates) {
    if ((await candidate.count()) > 0) {
      await candidate.first().fill(value, { timeout: PER_CANDIDATE_TIMEOUT_MS });
      return true;
    }
  }
  return false;
}

async function clickSubmit(page: Page): Promise<void> {
  // Stable testid since the 2023 hosted checkout refresh.
  const submit = page.getByTestId("hosted-payment-submit-button");
  if ((await submit.count()) > 0) {
    await submit.click();
    return;
  }
  // Fallback: role + name regex. Stripe's button is localized but the first
  // word is always a verb matching one of these.
  await page.getByRole("button", { name: /^(subscribe|pay|start trial|complete)/i }).click();
}
