"use server";

import type { WebhookEvent } from "@/lib/api/schemas/webhook";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { webhooksTable } from "@/lib/db/schema/webhook";
import { webhookDeliveriesTable } from "@/lib/db/schema/webhook-delivery";
import { isProUser } from "@/lib/tier";
import { decryptSecret, encryptSecret, generateSigningSecret, signPayload } from "@/lib/webhook-crypto";
import { and, count, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const FREE_WEBHOOK_LIMIT = 1;
const PRO_WEBHOOK_LIMIT = 10;

export type CreateWebhookResult = {
  error?: string;
  secret?: string;
  success: boolean;
};

export type WebhookActionResult = {
  error?: string;
  success: boolean;
};

export async function createWebhookAction(url: string, events: WebhookEvent[]): Promise<CreateWebhookResult> {
  const user = await getCurrentUser();
  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const limit = isProUser(user) ? PRO_WEBHOOK_LIMIT : FREE_WEBHOOK_LIMIT;

  const [{ count: webhookCount }] = await db
    .select({ count: count() })
    .from(webhooksTable)
    .where(eq(webhooksTable.userId, user.id));

  if (webhookCount >= limit) {
    return {
      error: isProUser(user)
        ? "youveReachedTheWebhookLimitOf10"
        : "freeAccountsAreLimitedTo1WebhookUpgradeToProForMore",
      success: false,
    };
  }

  try {
    new URL(url);
  } catch {
    return { error: "pleaseEnterAValidUrl", success: false };
  }

  if (events.length === 0) {
    return { error: "pleaseSelectAtLeastOneEvent", success: false };
  }

  const rawSecret = generateSigningSecret();
  const encryptedSecret = encryptSecret(rawSecret);

  await db.insert(webhooksTable).values({
    encryptedSecret,
    events,
    url,
    userId: user.id,
  });

  revalidatePath("/dashboard/api");

  return { secret: rawSecret, success: true };
}

export async function updateWebhookAction(
  webhookId: string,
  data: { active?: boolean; events?: WebhookEvent[]; url?: string },
): Promise<WebhookActionResult> {
  const user = await getCurrentUser();
  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [webhook] = await db
    .select()
    .from(webhooksTable)
    .where(and(eq(webhooksTable.id, webhookId), eq(webhooksTable.userId, user.id)))
    .limit(1);

  if (webhook == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const updates: Record<string, unknown> = {};

  if (data.url !== undefined) {
    try {
      new URL(data.url);
    } catch {
      return { error: "pleaseEnterAValidUrl", success: false };
    }
    updates.url = data.url;
  }

  if (data.events !== undefined) {
    if (data.events.length === 0) {
      return { error: "pleaseSelectAtLeastOneEvent", success: false };
    }
    updates.events = data.events;
  }

  if (data.active !== undefined) {
    updates.active = data.active;
    if (data.active) {
      updates.consecutiveFailures = 0;
    }
  }

  if (Object.keys(updates).length > 0) {
    await db.update(webhooksTable).set(updates).where(eq(webhooksTable.id, webhookId));
  }

  revalidatePath("/dashboard/api");

  return { success: true };
}

export async function deleteWebhookAction(webhookId: string): Promise<WebhookActionResult> {
  const user = await getCurrentUser();
  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  await db.delete(webhooksTable).where(and(eq(webhooksTable.id, webhookId), eq(webhooksTable.userId, user.id)));

  revalidatePath("/dashboard/api");

  return { success: true };
}

export async function sendTestWebhookAction(webhookId: string): Promise<WebhookActionResult> {
  const user = await getCurrentUser();
  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [webhook] = await db
    .select()
    .from(webhooksTable)
    .where(and(eq(webhooksTable.id, webhookId), eq(webhooksTable.userId, user.id)))
    .limit(1);

  if (webhook == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
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
      signal: AbortSignal.timeout(10_000),
    });
    statusCode = response.status;
    success = response.ok;
  } catch {
    // Network error
  }

  await db.insert(webhookDeliveriesTable).values({
    attempt: 1,
    event: "test",
    statusCode,
    success,
    webhookId,
  });

  revalidatePath("/dashboard/api");

  return { success: true };
}

export type WebhookDeliveryRow = {
  attempt: number;
  createdAt: string;
  event: string;
  id: string;
  statusCode: null | number;
  success: boolean;
};

export async function getWebhookDeliveries(webhookId: string): Promise<WebhookDeliveryRow[]> {
  const user = await getCurrentUser();
  if (user == null) {
    return [];
  }

  const [webhook] = await db
    .select({ id: webhooksTable.id })
    .from(webhooksTable)
    .where(and(eq(webhooksTable.id, webhookId), eq(webhooksTable.userId, user.id)))
    .limit(1);

  if (webhook == null) {
    return [];
  }

  const deliveries = await db
    .select()
    .from(webhookDeliveriesTable)
    .where(eq(webhookDeliveriesTable.webhookId, webhookId))
    .orderBy(desc(webhookDeliveriesTable.createdAt))
    .limit(50);

  return deliveries.map((d) => ({
    attempt: d.attempt,
    createdAt: d.createdAt.toISOString(),
    event: d.event,
    id: d.id,
    statusCode: d.statusCode,
    success: d.success,
  }));
}
