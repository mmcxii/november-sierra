import { expect, test } from "@playwright/test";
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
