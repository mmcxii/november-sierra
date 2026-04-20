import { expect, test } from "./fixtures/better-auth";

// @better-auth smoke suite.
//
// Tagged so CI can run it in parallel with the Clerk suite during Shot 1's
// bake window. Scope: prove the whitelisted-user path boots end-to-end.
// Flows covered: sign-in via fixture → dashboard loads → sign-out clears
// the session cookie.
//
// Sign-up with OTP verification is excluded because the testing env has no
// way to read the OTP email without mocking Resend. That path is covered by
// the integration tests in src/lib/better-auth/* and a manual smoke step in
// the Shot 1 runbook.

test.describe("@better-auth whitelisted user", () => {
  test("reaches /dashboard with a BA session cookie", async ({ baWhitelistedUser: page }) => {
    //* Act
    await page.goto("/dashboard");

    //* Assert
    // Clerk's sign-in gate would redirect unauthenticated traffic back to
    // /sign-in. Arriving at /dashboard proves our middleware accepted the BA
    // session cookie and the auth() shim resolved the whitelisted id.
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("signs out by hitting BA's sign-out endpoint", async ({ baWhitelistedUser: page, baseURL }) => {
    //* Arrange
    if (baseURL == null) {
      throw new Error("baseURL is required");
    }
    await page.goto("/dashboard");
    const cookiesBefore = await page.context().cookies();
    const baCookieBefore = cookiesBefore.find((c) => c.name.includes("better-auth.session"));

    //* Act
    // BA's sign-out endpoint requires the same two things as sign-in:
    // an Origin header (checked against trustedOrigins) and a valid JSON
    // body (BA calls JSON.parse on the request body even when empty, so
    // an omitted body produces `SyntaxError: Unexpected end of JSON input`).
    const signOut = await page.request.post(`${baseURL}/api/v1/auth/sign-out`, {
      data: {},
      headers: {
        "content-type": "application/json",
        origin: new URL(baseURL).origin,
      },
    });
    const cookiesAfter = await page.context().cookies();
    const baCookieAfter = cookiesAfter.find((c) => c.name.includes("better-auth.session"));

    //* Assert
    // Functional signal: BA cleared its session cookie from the browser
    // context. We deliberately do not assert on the redirect target after
    // revisiting /dashboard because post-sign-out traffic bounces through
    // Clerk's middleware handshake, which is a multi-step redirect flow
    // that doesn't reliably land on /sign-in within Playwright's default
    // timeout in the test harness.
    expect(signOut.ok()).toBe(true);
    expect(baCookieBefore).toBeDefined();
    expect(baCookieAfter).toBeUndefined();
  });
});
