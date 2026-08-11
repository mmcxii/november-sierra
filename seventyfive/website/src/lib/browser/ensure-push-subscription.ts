import { urlBase64ToUint8Array } from "@/lib/url-base64-to-uint8-array";

export type PushSubscriptionPayload = {
  auth: string;
  endpoint: string;
  p256dh: string;
};

/**
 * Register the push SW, reuse an existing subscription when present, and return
 * the payload to persist. Does not prompt for permission — caller must ensure
 * Notification.permission is "granted" (or request it) before calling.
 */
export async function ensurePushSubscription(vapidPublicKey: string): Promise<null | PushSubscriptionPayload> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  if (Notification.permission !== "granted") {
    return null;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (subscription == null) {
    subscription = await registration.pushManager.subscribe({
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      userVisibleOnly: true,
    });
  }

  const json = subscription.toJSON();
  if (json.endpoint == null || json.keys?.auth == null || json.keys.p256dh == null) {
    return null;
  }

  return {
    auth: json.keys.auth,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
  };
}

/** iOS Safari only delivers Web Push for Home Screen (standalone) PWAs. */
export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) {
    return true;
  }
  // iPadOS 13+ reports as MacIntel with touch
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}
