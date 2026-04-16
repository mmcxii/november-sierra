import { expect, test as baseTest } from "@playwright/test";
import { countWebhookDeliveries, createTestApiKey, deleteAllShortLinksForUser, deleteTestApiKeys } from "./fixtures/db";
import { testDomain, testUsers } from "./fixtures/test-users";

/**
 * Verifies that short-link CRUD operations dispatch the corresponding webhook
 * events (short_link.created / updated / deleted) to subscribed endpoints.
 *
 * We don't spin up a local HTTP listener — instead we subscribe a non-existent
 * URL and rely on the fact that webhook.ts records a webhook_deliveries row
 * even when the outbound POST fails (statusCode=null, success=false). The
 * presence of a row proves the event fired and was queued for this subscription.
 *
 * A follow-up test could bind a Node HTTP server to verify payload signature
 * and body shape end-to-end.
 */

const APP_URL = "http://localhost:3000";
const test = baseTest;

test.describe("short link webhook events", () => {
  test.describe.configure({ mode: "serial" });

  let apiKey: string;
  let webhookId: string;

  test.beforeAll(async ({ request }) => {
    apiKey = await createTestApiKey(testUsers.pro.username);

    // Subscribe to all three short-link events via the REST API.
    const subResponse = await request.post(`${APP_URL}/api/v1/webhooks`, {
      data: {
        events: ["short_link.created", "short_link.updated", "short_link.deleted"],
        url: `https://webhook.invalid/${Date.now().toString(36)}`,
      },
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    expect(subResponse.status()).toBe(201);
    const { data } = await subResponse.json();
    webhookId = data.id;
  });

  test.afterAll(async ({ request }) => {
    // Delete the webhook so subsequent runs aren't polluted.
    if (webhookId != null) {
      await request
        .delete(`${APP_URL}/api/v1/webhooks/${webhookId}`, { headers: { Authorization: `Bearer ${apiKey}` } })
        .catch(() => undefined);
    }
    // Clean up every short_link we created so the downstream short-links.spec
    // empty-state test sees a fresh pro user.
    await deleteAllShortLinksForUser(testUsers.pro.username).catch(() => undefined);
    await deleteTestApiKeys(testUsers.pro.username).catch(() => undefined);
  });

  test("short_link.created fires when a link is created", async ({ request }) => {
    //* Arrange
    const before = await countWebhookDeliveries({ event: "short_link.created", webhookId });

    //* Act
    const createResp = await request.post(`${APP_URL}/api/v1/short-links`, {
      data: { url: testDomain.url },
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });

    //* Assert — creation succeeded AND the delivery attempt row appears after
    //  the fire-and-forget dispatch; poll so we don't race the async insert.
    expect(createResp.status()).toBe(201);
    await expect
      .poll(() => countWebhookDeliveries({ event: "short_link.created", webhookId }), {
        intervals: [200, 500, 1000, 2000],
        timeout: 15_000,
      })
      .toBe(before + 1);
  });

  test("short_link.updated fires when a link is patched", async ({ request }) => {
    //* Arrange — create a link to update.
    const createResp = await request.post(`${APP_URL}/api/v1/short-links`, {
      data: { url: testDomain.url },
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    const { data } = await createResp.json();
    const before = await countWebhookDeliveries({ event: "short_link.updated", webhookId });

    //* Act
    await request.patch(`${APP_URL}/api/v1/short-links/${data.id}`, {
      data: { url: `${testDomain.url}/?v=updated` },
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });

    //* Assert
    await expect
      .poll(() => countWebhookDeliveries({ event: "short_link.updated", webhookId }), {
        intervals: [200, 500, 1000, 2000],
        timeout: 15_000,
      })
      .toBe(before + 1);
  });

  test("short_link.deleted fires when a link is deleted", async ({ request }) => {
    //* Arrange
    const createResp = await request.post(`${APP_URL}/api/v1/short-links`, {
      data: { url: testDomain.url },
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    const { data } = await createResp.json();
    const before = await countWebhookDeliveries({ event: "short_link.deleted", webhookId });

    //* Act
    await request.delete(`${APP_URL}/api/v1/short-links/${data.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    //* Assert
    await expect
      .poll(() => countWebhookDeliveries({ event: "short_link.deleted", webhookId }), {
        intervals: [200, 500, 1000, 2000],
        timeout: 15_000,
      })
      .toBe(before + 1);
  });
});
