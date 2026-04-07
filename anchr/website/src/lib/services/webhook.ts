import type { ApiKeyUser } from "@/lib/api/auth";
import { API_ERROR_CODES } from "@/lib/api/errors";
import type { CreateWebhookInput, UpdateWebhookInput, WebhookEvent } from "@/lib/api/schemas/webhook";
import { db } from "@/lib/db/client";
import { webhooksTable } from "@/lib/db/schema/webhook";
import { webhookDeliveriesTable } from "@/lib/db/schema/webhook-delivery";
import { decryptSecret, encryptSecret, generateSigningSecret, signPayload } from "@/lib/webhook-crypto";
import { and, count, desc, eq, lt } from "drizzle-orm";
import { serviceError, serviceSuccess, type ServiceResult } from "./types";

const FREE_WEBHOOK_LIMIT = 1;
const PRO_WEBHOOK_LIMIT = 10;
const AUTO_DISABLE_THRESHOLD = 5;
const DELIVERY_TIMEOUT_MS = 10_000;

export type WebhookResponse = {
  active: boolean;
  consecutiveFailures: number;
  createdAt: string;
  events: string[];
  id: string;
  url: string;
};

export type WebhookCreateResponse = WebhookResponse & {
  secret: string;
};

export type WebhookDeliveryResponse = {
  attempt: number;
  createdAt: string;
  event: string;
  id: string;
  statusCode: null | number;
  success: boolean;
};

function toWebhookResponse(webhook: typeof webhooksTable.$inferSelect): WebhookResponse {
  return {
    active: webhook.active,
    consecutiveFailures: webhook.consecutiveFailures,
    createdAt: webhook.createdAt.toISOString(),
    events: webhook.events,
    id: webhook.id,
    url: webhook.url,
  };
}

export async function listWebhooks(user: ApiKeyUser): Promise<ServiceResult<WebhookResponse[]>> {
  const webhooks = await db
    .select()
    .from(webhooksTable)
    .where(eq(webhooksTable.userId, user.id))
    .orderBy(desc(webhooksTable.createdAt));

  return serviceSuccess(webhooks.map(toWebhookResponse));
}

export async function createWebhook(
  user: ApiKeyUser,
  input: CreateWebhookInput,
): Promise<ServiceResult<WebhookCreateResponse>> {
  const limit = user.tier === "pro" ? PRO_WEBHOOK_LIMIT : FREE_WEBHOOK_LIMIT;

  const [{ count: webhookCount }] = await db
    .select({ count: count() })
    .from(webhooksTable)
    .where(eq(webhooksTable.userId, user.id));

  if (webhookCount >= limit) {
    const message =
      user.tier === "pro"
        ? `Pro tier is limited to ${PRO_WEBHOOK_LIMIT} webhooks.`
        : `Free tier is limited to ${FREE_WEBHOOK_LIMIT} webhook. Upgrade to Pro for up to ${PRO_WEBHOOK_LIMIT}.`;
    return serviceError(API_ERROR_CODES.WEBHOOK_LIMIT_REACHED, message, 403);
  }

  const rawSecret = generateSigningSecret();
  const encryptedSecret = encryptSecret(rawSecret);

  const [created] = await db
    .insert(webhooksTable)
    .values({
      encryptedSecret,
      events: input.events,
      url: input.url,
      userId: user.id,
    })
    .returning();

  return serviceSuccess({
    ...toWebhookResponse(created),
    secret: rawSecret,
  });
}

export async function updateWebhook(
  user: ApiKeyUser,
  id: string,
  input: UpdateWebhookInput,
): Promise<ServiceResult<WebhookResponse>> {
  const [existing] = await db
    .select()
    .from(webhooksTable)
    .where(and(eq(webhooksTable.id, id), eq(webhooksTable.userId, user.id)))
    .limit(1);

  if (existing == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Webhook not found.", 404);
  }

  const updates: Record<string, unknown> = {};

  if (input.url !== undefined) {
    updates.url = input.url;
  }

  if (input.events !== undefined) {
    updates.events = input.events;
  }

  if (input.active !== undefined) {
    updates.active = input.active;
    if (input.active) {
      updates.consecutiveFailures = 0;
    }
  }

  if (Object.keys(updates).length === 0) {
    return serviceSuccess(toWebhookResponse(existing));
  }

  const [updated] = await db
    .update(webhooksTable)
    .set(updates)
    .where(and(eq(webhooksTable.id, id), eq(webhooksTable.userId, user.id)))
    .returning();

  return serviceSuccess(toWebhookResponse(updated));
}

export async function deleteWebhook(user: ApiKeyUser, id: string): Promise<ServiceResult<null>> {
  const deleted = await db
    .delete(webhooksTable)
    .where(and(eq(webhooksTable.id, id), eq(webhooksTable.userId, user.id)));

  if (deleted.rowCount === 0) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Webhook not found.", 404);
  }

  return serviceSuccess(null);
}

export async function listDeliveries(
  user: ApiKeyUser,
  webhookId: string,
): Promise<ServiceResult<WebhookDeliveryResponse[]>> {
  // Verify ownership
  const [webhook] = await db
    .select({ id: webhooksTable.id })
    .from(webhooksTable)
    .where(and(eq(webhooksTable.id, webhookId), eq(webhooksTable.userId, user.id)))
    .limit(1);

  if (webhook == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Webhook not found.", 404);
  }

  const deliveries = await db
    .select()
    .from(webhookDeliveriesTable)
    .where(eq(webhookDeliveriesTable.webhookId, webhookId))
    .orderBy(desc(webhookDeliveriesTable.createdAt))
    .limit(50);

  return serviceSuccess(
    deliveries.map((d) => ({
      attempt: d.attempt,
      createdAt: d.createdAt.toISOString(),
      event: d.event,
      id: d.id,
      statusCode: d.statusCode,
      success: d.success,
    })),
  );
}

export async function sendTestEvent(user: ApiKeyUser, webhookId: string): Promise<ServiceResult<null>> {
  const [webhook] = await db
    .select()
    .from(webhooksTable)
    .where(and(eq(webhooksTable.id, webhookId), eq(webhooksTable.userId, user.id)))
    .limit(1);

  if (webhook == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Webhook not found.", 404);
  }

  const payload = JSON.stringify({
    data: {
      id: "test_" + crypto.randomUUID(),
      slug: "test-link",
      title: "Test Link",
      url: "https://example.com",
    },
    event: "link.created",
    timestamp: new Date().toISOString(),
  });

  const secret = decryptSecret(webhook.encryptedSecret);
  const signature = signPayload(payload, secret);

  let statusCode: null | number = null;
  let success = false;

  try {
    const response = await fetch(webhook.url, {
      body: payload,
      headers: {
        "Content-Type": "application/json",
        "X-Anchr-Signature-256": signature,
      },
      method: "POST",
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
    statusCode = response.status;
    success = response.ok;
  } catch {
    // Network error — statusCode stays null
  }

  await db.insert(webhookDeliveriesTable).values({
    attempt: 1,
    event: "test",
    statusCode,
    success,
    webhookId,
  });

  return serviceSuccess(null);
}

// ─── Webhook Dispatching ─────────────────────────────────────────────────────

export type WebhookEventPayload = {
  data: Record<string, unknown>;
  event: WebhookEvent;
  userId: string;
};

/**
 * Deliver webhook events to all matching active webhooks for a user.
 * Called from route handlers via after().
 */
export async function dispatchWebhookEvent(payload: WebhookEventPayload): Promise<void> {
  const webhooks = await db
    .select()
    .from(webhooksTable)
    .where(and(eq(webhooksTable.userId, payload.userId), eq(webhooksTable.active, true)));

  const matching = webhooks.filter((w) => w.events.includes(payload.event));

  await Promise.allSettled(matching.map((webhook) => deliverToWebhook(webhook, payload)));
}

async function deliverToWebhook(
  webhook: typeof webhooksTable.$inferSelect,
  payload: WebhookEventPayload,
): Promise<void> {
  const body = JSON.stringify({
    data: payload.data,
    event: payload.event,
    timestamp: new Date().toISOString(),
  });

  const secret = decryptSecret(webhook.encryptedSecret);
  const signature = signPayload(body, secret);

  let statusCode: null | number = null;
  let success = false;

  try {
    const response = await fetch(webhook.url, {
      body,
      headers: {
        "Content-Type": "application/json",
        "X-Anchr-Signature-256": signature,
      },
      method: "POST",
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
    statusCode = response.status;
    success = response.ok;
  } catch {
    // Network error
  }

  await db.insert(webhookDeliveriesTable).values({
    attempt: 1,
    event: payload.event,
    statusCode,
    success,
    webhookId: webhook.id,
  });

  if (success) {
    if (webhook.consecutiveFailures > 0) {
      await db.update(webhooksTable).set({ consecutiveFailures: 0 }).where(eq(webhooksTable.id, webhook.id));
    }
  } else {
    const newFailures = webhook.consecutiveFailures + 1;
    await db
      .update(webhooksTable)
      .set({
        active: newFailures >= AUTO_DISABLE_THRESHOLD ? false : webhook.active,
        consecutiveFailures: newFailures,
      })
      .where(eq(webhooksTable.id, webhook.id));
  }
}

// ─── Retry Logic (called by cron) ───────────────────────────────────────────

/**
 * Retry failed webhook deliveries that haven't reached max attempts (3).
 * Called by /api/cron/webhook-retries.
 */
export async function retryFailedDeliveries(): Promise<{ retried: number }> {
  // Find failed deliveries with attempt < 3 where the webhook is still active
  const failedDeliveries = await db
    .select({
      delivery: webhookDeliveriesTable,
      webhook: webhooksTable,
    })
    .from(webhookDeliveriesTable)
    .innerJoin(webhooksTable, eq(webhookDeliveriesTable.webhookId, webhooksTable.id))
    .where(
      and(
        eq(webhookDeliveriesTable.success, false),
        lt(webhookDeliveriesTable.attempt, 3),
        eq(webhooksTable.active, true),
      ),
    );

  // Deduplicate: only retry the latest attempt per webhook+event combo
  const latestByKey = new Map<string, (typeof failedDeliveries)[number]>();
  for (const row of failedDeliveries) {
    const key = `${row.delivery.webhookId}:${row.delivery.event}`;
    const existing = latestByKey.get(key);
    if (existing == null || row.delivery.createdAt > existing.delivery.createdAt) {
      latestByKey.set(key, row);
    }
  }

  // Filter out entries that already have a newer successful delivery or a delivery at attempt 3
  let retried = 0;

  for (const row of latestByKey.values()) {
    const body = JSON.stringify({
      data: {},
      event: row.delivery.event,
      timestamp: new Date().toISOString(),
    });

    const secret = decryptSecret(row.webhook.encryptedSecret);
    const signature = signPayload(body, secret);

    let statusCode: null | number = null;
    let success = false;

    try {
      const response = await fetch(row.webhook.url, {
        body,
        headers: {
          "Content-Type": "application/json",
          "X-Anchr-Signature-256": signature,
        },
        method: "POST",
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });
      statusCode = response.status;
      success = response.ok;
    } catch {
      // Network error
    }

    await db.insert(webhookDeliveriesTable).values({
      attempt: row.delivery.attempt + 1,
      event: row.delivery.event,
      statusCode,
      success,
      webhookId: row.webhook.id,
    });

    if (success) {
      if (row.webhook.consecutiveFailures > 0) {
        await db.update(webhooksTable).set({ consecutiveFailures: 0 }).where(eq(webhooksTable.id, row.webhook.id));
      }
    } else {
      const newFailures = row.webhook.consecutiveFailures + 1;
      await db
        .update(webhooksTable)
        .set({
          active: newFailures >= AUTO_DISABLE_THRESHOLD ? false : row.webhook.active,
          consecutiveFailures: newFailures,
        })
        .where(eq(webhooksTable.id, row.webhook.id));
    }

    retried++;
  }

  return { retried };
}

// ─── Cleanup (called by cron) ────────────────────────────────────────────────

/**
 * Delete webhook deliveries older than 7 days.
 * Called by /api/cron/webhook-cleanup.
 */
export async function cleanupOldDeliveries(): Promise<{ deleted: number }> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const result = await db.delete(webhookDeliveriesTable).where(lt(webhookDeliveriesTable.createdAt, sevenDaysAgo));

  return { deleted: result.rowCount ?? 0 };
}
