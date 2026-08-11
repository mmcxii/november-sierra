import { envSchema } from "@/lib/env";
import webpush from "web-push";

export type PushSubscriptionTarget = {
  auth: string;
  endpoint: string;
  p256dh: string;
};

export type SendPushResult =
  | {
      ok: false;
      statusCode: null | number;
    }
  | { ok: true };

let vapidConfigured = false;

export function configureWebPush(): { ok: false; reason: string } | { ok: true } {
  if (!envSchema.VAPID_PUBLIC_KEY || !envSchema.VAPID_PRIVATE_KEY) {
    return { ok: false, reason: "missing vapid keys" };
  }

  if (
    envSchema.NEXT_PUBLIC_VAPID_PUBLIC_KEY != null &&
    envSchema.NEXT_PUBLIC_VAPID_PUBLIC_KEY !== envSchema.VAPID_PUBLIC_KEY
  ) {
    return { ok: false, reason: "vapid public key mismatch between VAPID_PUBLIC_KEY and NEXT_PUBLIC_VAPID_PUBLIC_KEY" };
  }

  if (!vapidConfigured) {
    webpush.setVapidDetails(envSchema.VAPID_SUBJECT, envSchema.VAPID_PUBLIC_KEY, envSchema.VAPID_PRIVATE_KEY);
    vapidConfigured = true;
  }

  return { ok: true };
}

export function pushErrorStatusCode(error: unknown): null | number {
  if (typeof error !== "object" || error == null || !("statusCode" in error)) {
    return null;
  }
  const statusCode = Number((error as { statusCode: unknown }).statusCode);
  return Number.isFinite(statusCode) ? statusCode : null;
}

export async function sendPushNotification(
  target: PushSubscriptionTarget,
  payload: { body: string; title: string; url: string },
): Promise<SendPushResult> {
  try {
    await webpush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { auth: target.auth, p256dh: target.p256dh },
      },
      JSON.stringify(payload),
      {
        TTL: 60 * 60 * 24,
        urgency: "normal",
      },
    );
    return { ok: true };
  } catch (error) {
    const statusCode = pushErrorStatusCode(error);
    console.error("web-push send failed", { endpoint: target.endpoint, error, statusCode });
    return { ok: false, statusCode };
  }
}
