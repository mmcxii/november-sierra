import { expect, test } from "@playwright/test";

const SECTIONS = ["hero", "about", "products", "contact"] as const;

test.describe("site smoke tests", () => {
  test("app boots and serves the page", async ({ page }) => {
    //* Act
    await page.goto("/");

    //* Assert
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page.locator("text=APPLICATION_ERROR")).not.toBeVisible();
  });

  test("all sections render", async ({ page }) => {
    //* Act
    await page.goto("/");

    //* Assert
    for (const section of SECTIONS) {
      await expect(page.locator(`#${section}`)).toBeVisible();
    }
  });

  test("hero wordmark renders NOVEMBER SIERRA", async ({ page }) => {
    //* Arrange
    await page.goto("/");

    //* Act — wait for the full-name animation phase
    await page.waitForTimeout(4000);

    //* Assert
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("N");
    await expect(heading).toContainText("S");
  });

  test("hero tagline words appear", async ({ page }) => {
    //* Arrange
    await page.goto("/");

    //* Act — wait for the tagline animation phase
    await page.waitForTimeout(6500);

    //* Assert
    await expect(page.getByText("Thoughtful.")).toBeVisible();
    await expect(page.getByText("Intentional.")).toBeVisible();
    await expect(page.getByText("Software.")).toBeVisible();
  });

  test("about section displays the mission statement", async ({ page }) => {
    //* Act
    await page.goto("/");

    //* Assert
    await expect(page.getByText("Building products with intuitive interfaces designed for people")).toBeVisible();
  });

  test("products section renders Anchr card with link", async ({ page }) => {
    //* Act
    await page.goto("/");

    //* Assert
    const anchrCard = page.locator('a[href="https://anchr.to"]');
    await expect(anchrCard).toBeVisible();
    await expect(page.getByText("theme studio")).toBeVisible();
  });

  test("contact form fields are present", async ({ page }) => {
    //* Act
    await page.goto("/");

    //* Assert
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#topic")).toBeVisible();
    await expect(page.locator("#message")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send Message" })).toBeVisible();
  });

  test("footer renders copyright and GitHub link", async ({ page }) => {
    //* Act
    await page.goto("/");

    //* Assert
    await expect(page.getByText("2026 November Sierra")).toBeVisible();
    await expect(page.getByText("Built in the Pacific Northwest")).toBeVisible();
    await expect(page.getByLabel("GitHub")).toBeVisible();
  });
});

test.describe("navigation", () => {
  test("side nav is visible on desktop viewport", async ({ page }) => {
    //* Arrange
    await page.setViewportSize({ height: 900, width: 1440 });

    //* Act
    await page.goto("/");

    //* Assert
    const desktopNav = page.locator('nav[aria-label="Section navigation"]').first();
    await expect(desktopNav).toBeVisible();
    await expect(desktopNav.getByText("Home")).toBeVisible();
    await expect(desktopNav.getByText("About")).toBeVisible();
    await expect(desktopNav.getByText("Products")).toBeVisible();
    await expect(desktopNav.getByText("Contact")).toBeVisible();
  });

  test("mobile nav dots are visible on small viewport", async ({ page }) => {
    //* Arrange
    await page.setViewportSize({ height: 812, width: 375 });

    //* Act
    await page.goto("/");

    //* Assert — the mobile nav is the last nav (desktop nav is hidden via xl:flex)
    const mobileNav = page.locator('nav[aria-label="Section navigation"]').last();
    await expect(mobileNav).toBeVisible();
  });

  test("anchor links scroll to sections", async ({ page }) => {
    //* Arrange
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.goto("/");

    //* Act
    const desktopNav = page.locator('nav[aria-label="Section navigation"]').first();
    await desktopNav.locator('a[href="#about"]').click();
    await page.waitForTimeout(500);

    //* Assert
    const about = page.locator("#about");
    await expect(about).toBeInViewport();
  });
});

test.describe("theme toggle", () => {
  test("theme toggle activates fog mode", async ({ page }) => {
    //* Arrange
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.goto("/");

    //* Act
    const themeButton = page.getByLabel(/Switch to .* theme/);
    await themeButton.first().click();

    //* Assert
    await expect(page.locator("html")).toHaveAttribute("data-theme", "fog");
  });

  test("theme toggle returns to forest mode", async ({ page }) => {
    //* Arrange
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.goto("/");
    const themeButton = page.getByLabel(/Switch to .* theme/);
    await themeButton.first().click();
    await page.locator('html[data-theme="fog"]').waitFor();

    //* Act
    await themeButton.first().click();

    //* Assert
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", "fog");
  });

  test("theme persists across page reload", async ({ page }) => {
    //* Arrange
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.goto("/");
    const themeButton = page.getByLabel(/Switch to .* theme/);
    await themeButton.first().click();
    await page.locator('html[data-theme="fog"]').waitFor();

    //* Act
    await page.reload();

    //* Assert
    const storedTheme = await page.evaluate(() => {
      return localStorage.getItem("ns-theme");
    });
    expect(storedTheme).toBe("fog");
    await expect(page.getByLabel(/Switch to forest theme/).first()).toBeVisible();
  });
});

test.describe("contact form submission", () => {
  test("form validates required fields", async ({ page }) => {
    //* Arrange
    await page.goto("/");

    //* Act — try to submit empty form
    await page.getByRole("button", { name: "Send Message" }).click();

    //* Assert — form should not submit (HTML validation prevents it)
    const nameInput = page.locator("#name");
    const isValid = await nameInput.evaluate((el) => {
      return (el as HTMLInputElement).validity.valid;
    });
    expect(isValid).toBe(false);
  });
});

test.describe("accessibility", () => {
  test("skip link is present and targets main content", async ({ page }) => {
    //* Act
    await page.goto("/");

    //* Assert
    const skipLink = page.locator('a.skip-link[href="#about"]');
    await expect(skipLink).toBeAttached();
  });

  test("all images have alt text", async ({ page }) => {
    //* Act
    await page.goto("/");

    //* Assert
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt).not.toBeNull();
    }
  });
});
