import { urlBase64ToUint8Array } from "@/lib/url-base64-to-uint8-array";

export type PushSubscriptionPayload = {
  auth: string;
  endpoint: string;
  p256dh: string;
};

export type EnsurePushSubscriptionOptions = {
  /** Drop any existing browser subscription and create a fresh one (settings save). */
  rotate?: boolean;
};

function applicationServerKeysEqual(existing: undefined | null | ArrayBuffer, expected: Uint8Array): boolean {
  if (existing == null) {
    return false;
  }
  const bytes = new Uint8Array(existing);
  if (bytes.byteLength !== expected.byteLength) {
    return false;
  }
  for (let index = 0; index < bytes.byteLength; index += 1) {
    if (bytes[index] !== expected[index]) {
      return false;
    }
  }
  return true;
}

/**
 * Register the push SW and return a subscription payload to persist.
 * Does not prompt for permission — caller must ensure Notification.permission is "granted".
 */
export async function ensurePushSubscription(
  vapidPublicKey: string,
  options: EnsurePushSubscriptionOptions = {},
): Promise<null | PushSubscriptionPayload> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  if (Notification.permission !== "granted") {
    return null;
  }

  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  const shouldRotate =
    options.rotate === true ||
    (subscription != null &&
      !applicationServerKeysEqual(subscription.options.applicationServerKey, applicationServerKey));

  if (subscription != null && shouldRotate) {
    await subscription.unsubscribe();
    subscription = null;
  }

  if (subscription == null) {
    subscription = await registration.pushManager.subscribe({
      applicationServerKey: applicationServerKey as BufferSource,
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
