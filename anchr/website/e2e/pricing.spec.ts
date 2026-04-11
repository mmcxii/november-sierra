import { expect, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";

test.describe("pricing page", () => {
  test("billing toggle switches between monthly and annual prices", async ({ page }) => {
    //* Arrange
    await page.goto("/pricing");
    await page.getByText(t.$7Mo).waitFor();

    //* Act
    await page.getByRole("button", { name: t.annual }).click();

    //* Assert — annual pricing shown
    await expect(page.getByText(t.$5Mo)).toBeVisible();
    await expect(page.getByText(t.save$24, { exact: true })).toBeVisible();
    await expect(page.getByText(t.$60BilledAnnually)).toBeVisible();

    //* Act — switch back
    await page.getByRole("button", { name: t.monthly }).click();

    //* Assert — monthly pricing restored
    await expect(page.getByText(t.$7Mo)).toBeVisible();
  });

  test("anonymous visitors see Free and Pro card CTAs that route to sign-up", async ({ page }) => {
    //* Act
    await page.goto("/pricing");
    await page.getByText(t.$7Mo).waitFor();

    //* Assert — Pro CTA is unique to the Pro card; "Get started" appears twice
    // (Free card + the "Ready to drop anchor?" section), both pointing to /sign-up.
    const proCta = page.getByRole("link", { name: t.upgradeToPro });
    await expect(proCta).toHaveCount(1);
    await expect(proCta).toHaveAttribute("href", "/sign-up");

    const getStartedLinks = page.getByRole("link", { name: t.getStarted });
    await expect(getStartedLinks).toHaveCount(2);
    for (const link of await getStartedLinks.all()) {
      await expect(link).toHaveAttribute("href", "/sign-up");
    }
  });

  test("pro-tier user sees no Upgrade CTAs on the pricing cards", async ({ proUser: page }) => {
    //* Act
    await page.goto("/pricing");
    await page.getByText(t.$7Mo).waitFor();

    //* Assert — no "Upgrade to Pro" anywhere on the pricing page for pro users.
    // The bottom "Ready to drop anchor?" section still links to /sign-up with
    // "Get started" — that's unchanged by ANC-107, so we expect exactly 1 match.
    await expect(page.getByRole("link", { name: t.upgradeToPro })).toHaveCount(0);
    await expect(page.getByRole("button", { name: t.upgradeToPro })).toHaveCount(0);
    await expect(page.getByRole("link", { name: t.getStarted })).toHaveCount(1);
  });

  test("FAQ accordion expands and collapses", async ({ page }) => {
    //* Arrange
    await page.goto("/pricing");
    const faqQuestion = page.getByText(t.canISwitchBetweenMonthlyAndAnnualBilling);
    const faqAnswer = page.getByText("Yes! You can switch between monthly");

    //* Act — expand
    await faqQuestion.click();

    //* Assert — answer visible
    await expect(faqAnswer).toBeVisible();

    //* Act — collapse
    await faqQuestion.click();

    //* Assert — answer no longer visible
    await expect(faqAnswer).not.toBeVisible();
  });
});
