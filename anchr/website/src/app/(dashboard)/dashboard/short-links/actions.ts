"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  createShortLink as createShortLinkService,
  deleteShortLink as deleteShortLinkService,
} from "@/lib/services/short-link";
import { isProUser } from "@/lib/tier";

export type ShortLinkActionResult =
  | {
      shortLink: {
        createdAt: string;
        customSlug: null | string;
        expiresAt: null | string;
        id: string;
        passwordProtected: boolean;
        shortUrl: string;
        slug: string;
        url: string;
      };
      success: true;
    }
  | { error: string; success: false };

export async function createShortLinkAction(formData: {
  customSlug?: string;
  expiresAt?: string;
  password?: string;
  url: string;
}): Promise<ShortLinkActionResult> {
  const user = await getCurrentUser();
  if (user == null) {
    return { error: "unauthorized", success: false };
  }

  const result = await createShortLinkService(
    { id: user.id, tier: isProUser(user) ? "pro" : "free", username: user.username },
    { customSlug: formData.customSlug, expiresAt: formData.expiresAt, password: formData.password, url: formData.url },
  );

  if (result.error != null) {
    return { error: result.error.message, success: false };
  }

  return { shortLink: result.data, success: true };
}

export async function deleteShortLinkAction(id: string): Promise<{ error?: string; success: boolean }> {
  const user = await getCurrentUser();
  if (user == null) {
    return { error: "unauthorized", success: false };
  }

  const result = await deleteShortLinkService(
    { id: user.id, tier: isProUser(user) ? "pro" : "free", username: user.username },
    id,
  );

  if (result.error != null) {
    return { error: result.error.message, success: false };
  }

  return { success: true };
}
