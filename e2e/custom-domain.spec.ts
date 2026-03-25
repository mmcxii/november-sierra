import { createLink, deleteLink, expect, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";
import { testDomain, testUsers } from "./fixtures/test-users";

test.describe("custom domain", () => {
  test.describe.configure({ mode: "serial" });

  test("adds a custom domain and shows DNS instructions", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { name: t.settings }).waitFor();

    // If a domain is already configured from a previous run, remove it first
    const removeButton = page.getByRole("button", { name: t.removeDomain });
    if (await removeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await removeButton.click();
      await page.getByText(t.domainRemoved).waitFor();
      await page.waitForTimeout(1000);
    }

    //* Act
    const domainInput = page.getByPlaceholder("yourdomain.com");
    await domainInput.clear();
    await domainInput.pressSequentially(testDomain.subdomain, { delay: 20 });
    await page.getByRole("button", { name: t.addDomain }).click();
    await page.waitForTimeout(2000);
    await page.reload();
    await page.getByRole("heading", { name: t.settings }).waitFor();

    //* Assert — DNS instructions appear
    await expect(page.getByText(t.addThisCnameRecordToYourDnsProvider)).toBeVisible();
    await expect(page.getByRole("cell", { exact: true, name: "CNAME" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "cname.vercel-dns.com" })).toBeVisible();
    await expect(page.getByRole("button", { name: t.verifyDns })).toBeVisible();
    await expect(page.getByRole("button", { name: t.removeDomain })).toBeVisible();
  });

  test("verifies DNS and reaches connected or pending state", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { name: t.settings }).waitFor();

    //* Act
    await page.getByRole("button", { name: t.verifyDns }).click();

    //* Assert — one of three valid post-verify states
    const connected = page.getByText(t.domainConnected);
    const sslPending = page.getByText(t.sslIsBeingProvisionedPleaseWaitAFewMinutesAndTryAgain);
    const dnsPending = page.getByText(t.dnsNotConfiguredYetPleaseAddTheCnameRecordAndTryAgain);

    await expect(connected.or(sslPending).or(dnsPending)).toBeVisible();
  });

  test("custom domain serves user public profile", async ({ proUser: page }) => {
    //* Arrange — create a link so the profile has content
    await createLink(page, "Custom Domain Link", "https://example.com/custom-domain");

    //* Act — request the custom domain root via the dev server with a spoofed Host header
    // Browsers can't override Host, but Playwright's API context can.
    // This hits localhost:3000 with Host: {subdomain} so the middleware
    // treats it as a custom domain request and rewrites to /{username}.
    const response = await page.request.get("http://localhost:3000/", {
      headers: { Host: testDomain.subdomain },
    });

    //* Assert — response is OK and contains the link we created
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("Custom Domain Link");

    //* Arrange — cleanup
    await deleteLink(page, "Custom Domain Link");
  });

  test("custom domain redirects link slugs", async ({ proUser: page }) => {
    //* Arrange — create a link with a known slug
    await createLink(
      page,
      "Domain Redirect Link",
      "https://example.com",
      "e2e-domain-redirect",
    );

    //* Act — request the slug path via the custom domain Host header
    const response = await page.request.get(
      "http://localhost:3000/e2e-domain-redirect",
      {
        headers: { Host: testDomain.subdomain },
        maxRedirects: 0,
      },
    );

    //* Assert — the middleware rewrites to /{username}/{slug} which returns a redirect
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers().location).toContain("example.com");

    //* Arrange — cleanup
    await deleteLink(page, "Domain Redirect Link");
  });

  test("removes the custom domain", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { name: t.settings }).waitFor();

    //* Act
    await page.getByRole("button", { name: t.removeDomain }).click();

    //* Assert — domain removed, input reappears
    await expect(page.getByText(t.domainRemoved)).toBeVisible();
    await expect(page.getByPlaceholder("yourdomain.com")).toBeVisible();
  });
});
