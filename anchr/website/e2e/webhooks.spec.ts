import { type APIRequestContext, request as playwrightRequest } from "@playwright/test";
import { expect, test } from "./fixtures/auth";
import { createTestApiKey, deleteTestApiKeys } from "./fixtures/db";
import { t } from "./fixtures/i18n";
import { testUsers } from "./fixtures/test-users";

// Unique suffix per file execution so serial-block retries don't collide
const suffix = Date.now().toString(36);

test.describe("webhook lifecycle", () => {
  test.describe.configure({ mode: "serial" });

  const webhookUrl = `https://example.com/webhook-${suffix}`;
  const updatedUrl = `https://example.com/webhook-updated-${suffix}`;

  test("creates a webhook and displays signing secret once", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/api");
    await page.getByRole("heading", { exact: true, name: t.webhooks }).waitFor();

    //* Act — open create dialog, fill form, and submit
    await page.getByRole("button", { name: t.createWebhook }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(t.endpointUrl).fill(webhookUrl);
    await dialog.locator("label", { hasText: "link.created" }).click();
    await dialog.locator("label", { hasText: "link.deleted" }).click();
    await dialog.getByRole("button", { name: t.create }).click();

    //* Assert — secret step is shown with signing secret (64-char hex string)
    await expect(dialog.getByText(t.webhookCreated)).toBeVisible({ timeout: 15_000 });
    await expect(dialog.locator("code").filter({ hasText: /^[0-9a-f]{64}$/ })).toBeVisible();
    await expect(dialog.getByText(t.thisSecretWillOnlyBeShownOnce)).toBeVisible();

    //* Act — close dialog
    await dialog.getByRole("button", { name: t.done }).click();

    //* Assert — webhook appears in the table
    await expect(page.locator("tr", { hasText: webhookUrl })).toBeVisible();
    await expect(page.locator("tr", { hasText: webhookUrl }).getByText(t.active)).toBeVisible();
  });

  test("edits a webhook URL and events", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/api");
    const webhookRow = page.locator("tr", { hasText: webhookUrl });
    await webhookRow.waitFor();

    //* Act — open edit dialog, change URL and events, and save
    await webhookRow
      .getByRole("button")
      .filter({ has: page.locator("svg.lucide-settings") })
      .click();
    const dialog = page.getByRole("dialog");
    const urlInput = dialog.getByLabel(t.endpointUrl);
    await urlInput.clear();
    await urlInput.fill(updatedUrl);
    await dialog.locator("label", { hasText: "group.created" }).click();
    await dialog.getByRole("button", { name: t.save }).click();

    //* Assert — dialog closes and updated URL appears
    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await expect(page.locator("tr", { hasText: updatedUrl })).toBeVisible();
  });

  test("sends a test event", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/api");
    const webhookRow = page.locator("tr", { hasText: updatedUrl });
    await webhookRow.waitFor();

    //* Act — click test button
    await webhookRow.getByRole("button", { name: t.test }).click();

    //* Assert — toast confirms test event sent
    await expect(page.getByText(t.testEventSent)).toBeVisible({ timeout: 15_000 });
  });

  test("views delivery log", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/api");
    const webhookRow = page.locator("tr", { hasText: updatedUrl });
    await webhookRow.waitFor();

    //* Act — open delivery log dialog
    await webhookRow.getByRole("button", { name: t.log }).click();

    //* Assert — delivery log dialog shows the test event
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(t.deliveryLog)).toBeVisible();
    await expect(dialog.locator("td", { hasText: "test" })).toBeVisible({ timeout: 10_000 });

    //* Act — close dialog
    await dialog.getByRole("button", { name: t.close }).first().click();

    //* Assert — dialog is closed
    await expect(dialog).toBeHidden();
  });

  test("deletes a webhook with confirmation", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/api");
    const webhookRow = page.locator("tr", { hasText: updatedUrl });
    await webhookRow.waitFor();

    //* Act — open delete dialog and confirm
    await webhookRow
      .getByRole("button")
      .filter({ has: page.locator("svg.lucide-trash-2") })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: t.delete }).click();

    //* Assert — dialog closes and webhook is gone
    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await expect(page.locator("tr", { hasText: updatedUrl })).toBeHidden();
  });

  test("shows empty state when no webhooks exist", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/api");

    //* Act — scroll to webhooks section
    await page.getByRole("heading", { exact: true, name: t.webhooks }).scrollIntoViewIfNeeded();

    //* Assert — empty state
    await expect(page.getByText(t.noWebhooksYet)).toBeVisible();
  });
});

test.describe("webhook free tier limit", () => {
  const freeUrl = `https://example.com/free-webhook-${suffix}`;

  test("enforces limit of 1 webhook for free users", async ({ freeUser: page }) => {
    //* Arrange — navigate and clean up any leftover webhooks
    await page.goto("/dashboard/api");
    await page.getByRole("heading", { exact: true, name: t.webhooks }).waitFor();

    while (
      await page
        .locator("svg.lucide-trash-2")
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await page.locator("svg.lucide-trash-2").first().click();
      const cleanupDialog = page.getByRole("dialog");
      await cleanupDialog.getByRole("button", { name: t.delete }).click();
      await cleanupDialog.waitFor({ state: "hidden", timeout: 10_000 });
    }

    //* Act — create first webhook
    await page.getByRole("button", { name: t.createWebhook }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(t.endpointUrl).fill(freeUrl);
    await dialog.locator("label", { hasText: "link.created" }).click();
    await dialog.getByRole("button", { name: t.create }).click();

    //* Assert — secret shown (creation succeeded)
    await expect(dialog.getByText(t.webhookCreated)).toBeVisible({ timeout: 15_000 });

    //* Act — close dialog and try to create a second webhook
    await dialog.getByRole("button", { name: t.done }).click();
    await page.getByRole("button", { name: t.createWebhook }).click();
    const dialog2 = page.getByRole("dialog");
    await dialog2.getByLabel(t.endpointUrl).fill("https://example.com/second");
    await dialog2.locator("label", { hasText: "link.created" }).click();
    await dialog2.getByRole("button", { name: t.create }).click();

    //* Assert — limit error shown
    await expect(page.getByText(t.freeAccountsAreLimitedTo1WebhookUpgradeToProForMore)).toBeVisible();

    //* Arrange — cleanup: close dialog and delete the webhook
    await page.keyboard.press("Escape");
    await page.locator("svg.lucide-trash-2").first().click();
    const deleteDialog = page.getByRole("dialog");
    await deleteDialog.getByRole("button", { name: t.delete }).click();
    await deleteDialog.waitFor({ state: "hidden", timeout: 10_000 });
  });
});

test.describe("webhook API routes", () => {
  test.describe.configure({ mode: "serial" });

  let apiKey: string;
  let apiRequest: APIRequestContext;
  let webhookId: string;

  test.beforeAll(async () => {
    apiKey = await createTestApiKey(testUsers.pro.username);
    apiRequest = await playwrightRequest.newContext({
      baseURL: "http://localhost:3000",
    });
  });

  test.afterAll(async () => {
    await deleteTestApiKeys(testUsers.pro.username);
    await apiRequest.dispose();
  });

  test("POST /api/v1/webhooks creates a webhook", async () => {
    //* Act
    const response = await apiRequest.post("/api/v1/webhooks", {
      data: {
        events: ["link.created", "link.deleted"],
        url: `https://example.com/api-test-${suffix}`,
      },
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    //* Assert
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data.id).toBeDefined();
    expect(body.data.url).toBe(`https://example.com/api-test-${suffix}`);
    expect(body.data.events).toEqual(["link.created", "link.deleted"]);
    expect(body.data.secret).toBeDefined();
    expect(body.data.active).toBe(true);

    webhookId = body.data.id;
  });

  test("GET /api/v1/webhooks lists webhooks", async () => {
    //* Act
    const response = await apiRequest.get("/api/v1/webhooks", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    //* Assert
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    const webhook = body.data.find((w: { id: string }) => w.id === webhookId);
    expect(webhook).toBeDefined();
    expect(webhook.url).toBe(`https://example.com/api-test-${suffix}`);
  });

  test("PATCH /api/v1/webhooks/:id updates a webhook", async () => {
    //* Act
    const response = await apiRequest.patch(`/api/v1/webhooks/${webhookId}`, {
      data: {
        events: ["link.created"],
        url: `https://example.com/api-test-updated-${suffix}`,
      },
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    //* Assert
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.url).toBe(`https://example.com/api-test-updated-${suffix}`);
    expect(body.data.events).toEqual(["link.created"]);
  });

  test("GET /api/v1/webhooks/:id/deliveries returns delivery log", async () => {
    //* Act
    const response = await apiRequest.get(`/api/v1/webhooks/${webhookId}/deliveries`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    //* Assert
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("POST /api/v1/webhooks/:id/test sends a test event", async () => {
    //* Act
    const response = await apiRequest.post(`/api/v1/webhooks/${webhookId}/test`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    //* Assert
    expect(response.status()).toBe(200);
  });

  test("DELETE /api/v1/webhooks/:id deletes a webhook", async () => {
    //* Act
    const response = await apiRequest.delete(`/api/v1/webhooks/${webhookId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    //* Assert
    expect(response.status()).toBe(200);

    //* Act — verify webhook is gone
    const listResponse = await apiRequest.get("/api/v1/webhooks", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    //* Assert
    const body = await listResponse.json();
    const found = body.data.find((w: { id: string }) => w.id === webhookId);
    expect(found).toBeUndefined();
  });

  test("POST /api/v1/webhooks rejects invalid payload", async () => {
    //* Act — missing events
    const response = await apiRequest.post("/api/v1/webhooks", {
      data: { url: "https://example.com/test" },
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    //* Assert
    expect(response.status()).toBe(400);
  });

  test("GET /api/v1/webhooks rejects unauthenticated requests", async () => {
    //* Act
    const response = await apiRequest.get("/api/v1/webhooks");

    //* Assert
    expect(response.status()).toBe(401);
  });
});
