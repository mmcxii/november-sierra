# ANC-119: E2E Test Coverage — High & Medium Value Gaps

## Overview

Expand E2E coverage from 31 tests (basic CRUD + smoke) to comprehensive functional tests covering onboarding, analytics, advanced link features, settings interactions, pricing, bulk/group actions, and public profile behavior.

---

## Phase 1: Infrastructure Updates

### 1a. Add fresh (non-onboarded) seed user

**File:** `e2e/scripts/seed.ts`

Add a third user to the `USERS` array:

```
{ email: "e2e-fresh@anchr.io", role: "fresh", tier: "free" }
```

Set `onboardingComplete: false` for this user (unlike pro/admin which are `true`).

Change the DB insert from `onConflictDoNothing()` to `onConflictDoUpdate()` so that re-runs correctly reset `onboardingComplete` for the fresh user even if teardown didn't run.

### 1b. Add `freshUser` fixture

**File:** `e2e/fixtures/auth.ts`

Add a `freshUser` fixture that signs in as `e2e-fresh@anchr.io` but navigates to `/onboarding` instead of `/dashboard` (since the dashboard layout redirects non-onboarded users to `/onboarding`).

### 1c. Add `freeUser` fixture

**File:** `e2e/fixtures/auth.ts`

Add a `freeUser` fixture that signs in as `e2e-admin@anchr.io` (free tier, onboarded). This separates the semantic intent of "test as a free-tier user" from "test as an admin", even though they share the same seed user today.

---

## Phase 2: Onboarding Flow (NEW: `e2e/onboarding.spec.ts`)

Serial tests — onboarding mutates user state step-by-step.

| #   | Test                                                | Approach                                                                                                   |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | redirects non-onboarded user to /onboarding         | `freshUser` navigates to `/dashboard`, assert URL contains `/onboarding`                                   |
| 2   | username step: validates and submits username       | Verify input auto-focused, type a username, wait for availability check (green check icon), click Continue |
| 3   | link step: adds first link                          | Fill title + URL, click Continue; verify advances to theme step                                            |
| 4   | link step: can be skipped                           | (separate test or fold into step 3 by checking Skip button exists)                                         |
| 5   | theme step: selects themes and completes            | Verify dark/light theme grids render, select a theme swatch, click Continue                                |
| 6   | complete step: shows success and links to dashboard | Verify "Your page is live!" heading, click link to `/dashboard`, verify dashboard loads                    |

**Note:** Since the fresh user's `onboardingComplete` is set to `true` after test 6, these MUST be serial and the seed must reset the flag each run (handled by Phase 1a's `onConflictDoUpdate`).

---

## Phase 3: Analytics Expansion (MODIFY: `e2e/analytics.spec.ts`)

Currently 1 test (heading renders). Expand to:

| #   | Test                                                   | Approach                                                                                                                                                           |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | renders empty state when no click data                 | Navigate to `/dashboard/analytics`, assert "No click data yet" message and BarChart icon visible                                                                   |
| 2   | date range selector shows correct options for Pro user | Verify "Last 7 days" button active, "Last 30 days" and "All time" buttons enabled (not locked)                                                                     |
| 3   | date range selector restricts free user                | Use `freeUser`, verify "Last 30 days" and "All time" buttons are disabled/show lock icon                                                                           |
| 4   | renders metrics strip labels                           | Assert "Total clicks", "Top link", and "Top country" labels visible                                                                                                |
| 5   | generates click data and verifies analytics            | Create a link (proUser), visit the redirect URL `/{username}/{slug}` in a new context, navigate to analytics, verify click count > 0 or chart section renders data |

Test 5 is the most valuable — it proves the full click-tracking pipeline end-to-end.

---

## Phase 4: Advanced Link Features (MODIFY: `e2e/links.spec.ts`)

Add new tests after the existing serial CRUD block (in a separate `describe` so they run independently):

| #   | Test                                    | Approach                                                                                                                                                                                                         |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | creates a link with custom slug         | Open Add link, fill title + URL, clear the auto-generated slug, type custom slug `e2e-custom-slug`, save, verify link created. Visit `/{username}/e2e-custom-slug` and verify redirect. Cleanup: delete the link |
| 2   | detects platform from URL               | Open Add link, type `https://github.com/test` in URL field, assert platform badge with "GitHub" text appears below the URL input                                                                                 |
| 3   | activates Nostr mode for npub URLs      | Open Add link, paste an `npub1...` value in URL, verify "Nostr client" dropdown appears, verify URL check is skipped. Clean up                                                                                   |
| 4   | toggles featured link (Pro)             | Create a link, open Actions menu, click "Feature link", verify "Featured" badge appears on the link card. Click "Unfeature link", verify badge removed. Cleanup                                                  |
| 5   | opens QR code modal for individual link | Create a link, open Actions menu, click "QR Code", verify QR code dialog opens with download button and style options (light/dark). Cleanup                                                                      |
| 6   | selects icon for link (Pro)             | Create a link, edit it, verify Icon section visible, click icon picker, use search input, select an icon, save. Verify icon appears on link card. Cleanup                                                        |

---

## Phase 5: Settings Enhancements (MODIFY: `e2e/settings.spec.ts`)

Add new tests:

| #   | Test                                             | Approach                                                                                                                                                                                        |
| --- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | changes username with availability check         | Navigate to settings, clear username input, type new username `e2e-pro-renamed`, wait for green check (available), click Save. Verify success. **Revert:** change back to `e2e-pro`, save again |
| 2   | selects dashboard dark theme                     | Navigate to settings, find "Dashboard theme" section, verify dark theme swatches render, click a different swatch, verify it gets selected state                                                |
| 3   | selects page theme                               | Find "Page theme" section, verify dark/light theme pickers render, click a different dark theme swatch, verify selection updates                                                                |
| 4   | toggles branding visibility (Pro)                | Find "Branding" section, click "Hide branding" button, verify text changes to "Show branding". Click again to revert                                                                            |
| 5   | shows free-tier restrictions for domain/branding | Use `freeUser`, navigate to settings, verify custom domain section shows upgrade prompt, verify branding section is disabled                                                                    |

---

## Phase 6: Group & Bulk Actions

### 6a. Group visibility (MODIFY: `e2e/groups.spec.ts`)

Add to the existing serial block:

| #   | Test                     | Approach                                                                                                                                                  |
| --- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | toggles group visibility | After creating a group, find the Eye icon button on the group header, click it, verify group shows "Hidden" badge / reduced opacity. Click again to show. |

Insert this between "creates a link inside a group" and "edits a group name" in the serial sequence.

### 6b. Bulk visibility (MODIFY: `e2e/links.spec.ts`)

Add a new test in the independent describe block:

| #   | Test                       | Approach                                                                                                                                                                                                     |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | bulk hides and shows links | Create 2 links. Check "Select all" checkbox. Click "Hide selected" in bulk bar. Verify "Hidden" badges appear on both links. Click "Select all" again, click "Show selected". Verify badges removed. Cleanup |

---

## Phase 7: Pricing Page (NEW: `e2e/pricing.spec.ts`)

Unauthenticated tests (use base `test` from `@playwright/test`, not auth fixture):

| #   | Test                                | Approach                                                                                                                  |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | renders pricing hero and plan cards | Navigate to `/pricing`, verify heading "Simple, transparent pricing", verify "Free" and "Pro" card titles visible         |
| 2   | billing toggle switches prices      | Verify monthly price "$7/mo" visible. Click "Annual" toggle, verify price changes to "$5/mo" and "Save $24" badge appears |
| 3   | free plan lists correct features    | Verify feature bullets: "Up to 5 links", "Basic analytics", etc.                                                          |
| 4   | pro plan lists correct features     | Verify "Unlimited links", "Custom domains", etc.                                                                          |
| 5   | FAQ accordion expands and collapses | Click first FAQ question, verify answer text becomes visible. Click again, verify it collapses                            |

---

## Phase 8: Public Profile & Redirect (MODIFY: `e2e/public-profile.spec.ts`)

| #   | Test                                     | Approach                                                                                                                                                                                                                               |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | theme toggle switches light/dark mode    | Visit `/e2e-pro`, find theme toggle buttons (Sun/Moon icons), click Moon, verify dark class or theme applied. Click Sun, verify light mode                                                                                             |
| 2   | link redirect tracks click and redirects | Create a link with known slug. Open new page context, navigate to `/e2e-pro/{slug}`. Verify page redirects to target URL (check `page.url()` matches target). Navigate to analytics, verify "Total clicks" reflects the visit. Cleanup |

---

## Phase 9: Drag-and-Drop (MODIFY: `e2e/links.spec.ts`)

| #   | Test                             | Approach                                                                                                                                                                       |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | reorders links via drag-and-drop | Create 3 links (A, B, C). Use Playwright's drag API (`locator.dragTo()`) to move link C's grip handle above link A. Verify new order is C, A, B by checking DOM order. Cleanup |

**Risk:** dnd-kit may use transforms/translate rather than DOM reordering, making assertions on visual order tricky. If Playwright's `dragTo()` doesn't trigger dnd-kit's sensors, fall back to manual mouse events (`page.mouse.move/down/up`). If this proves too flaky, deprioritize and move to the harder-to-test ticket instead.

---

## Summary: Test Count Estimate

| Spec File              | Existing | New        | Total      |
| ---------------------- | -------- | ---------- | ---------- |
| onboarding.spec.ts     | 0        | 6          | 6          |
| analytics.spec.ts      | 1        | 4-5        | 5-6        |
| links.spec.ts          | 5        | 7-8        | 12-13      |
| settings.spec.ts       | 5        | 5          | 10         |
| groups.spec.ts         | 4        | 1          | 5          |
| pricing.spec.ts        | 0        | 5          | 5          |
| public-profile.spec.ts | 2        | 2          | 4          |
| auth.spec.ts           | 6        | 0          | 6          |
| dashboard.spec.ts      | 2        | 0          | 2          |
| marketing.spec.ts      | 4        | 0          | 4          |
| navigation.spec.ts     | 2        | 0          | 2          |
| **Total**              | **31**   | **~30-32** | **~61-63** |

---

## Separate Ticket: Harder-to-Test Gaps

Create Linear ticket **ANC-XXX: E2E tests requiring external service mocking** for features that need infrastructure beyond what's currently available:

1. **Sign-up full flow** — requires intercepting Clerk's email OTP; needs a test mailbox service (e.g., Mailosaur) or Clerk testing API for OTP bypass
2. **Sign-in 2FA flow** — same OTP interception issue
3. **Email change in settings** — OTP verification for new email address
4. **Avatar upload** — requires UploadThing to accept file uploads in test; Playwright can set file inputs via `setInputFiles()` but UploadThing's server-side validation/storage may reject test requests
5. **Avatar removal** — depends on having an uploaded avatar first
6. **Admin dashboard** — referral code CRUD; requires `ADMIN_USER_ID` env var to match a seeded user's Clerk ID (which is dynamic per run). Needs either a fixed test admin or a way to set the env var dynamically
7. **Stripe checkout/billing** — `createCheckoutSession()` and `createPortalSession()` redirect to Stripe-hosted pages; needs Stripe test mode with test card flows
8. **Webhook handlers** — Clerk user sync, Stripe payment events; better suited for integration tests with mocked payloads
9. **Referral code redemption** — needs a valid admin-created code and a second user to redeem it; complex multi-user test setup
10. **Custom domain DNS verification** — `verifyCustomDomain()` calls Vercel API to check DNS; can test the UI form and add/remove, but actual verification needs a real domain or Vercel API mock

---

## Implementation Order

1. Phase 1 (infrastructure) — must go first, unblocks Phase 2
2. Phase 7 (pricing) — independent, no auth needed, quick win
3. Phase 2 (onboarding) — high value, uses new fresh user
4. Phase 5 (settings) — medium complexity, expands existing file
5. Phase 4 (advanced links) — high value, most new tests
6. Phase 6 (group/bulk actions) — small additions to existing files
7. Phase 3 (analytics) — test 5 (click tracking) is the most complex
8. Phase 8 (public profile) — depends on link creation working reliably
9. Phase 9 (drag-and-drop) — highest risk of flakiness, do last
10. Create Linear ticket for harder-to-test gaps
