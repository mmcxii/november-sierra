"use server";

import {
  FREE_API_KEY_LIMIT,
  generateApiKey,
  getKeyPrefix,
  getKeySuffix,
  hashApiKey,
  isValidApiKeyName,
} from "@/lib/api-keys";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { apiKeysTable } from "@/lib/db/schema/api-key";
import { isProUser } from "@/lib/tier";
import { and, count, eq, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type CreateApiKeyResult = {
  error?: string;
  rawKey?: string;
  success: boolean;
};

export type ActionResult = {
  error?: string;
  success: boolean;
};

export async function createApiKey(name: string): Promise<CreateApiKeyResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const trimmedName = name.trim();

  if (!isValidApiKeyName(trimmedName)) {
    return { error: "invalidApiKeyNameUseLettersNumbersSpacesHyphensOrUnderscoresMax64Characters", success: false };
  }

  // Check uniqueness among active keys
  const [existingActive] = await db
    .select({ count: count() })
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.userId, user.id), eq(apiKeysTable.name, trimmedName), isNull(apiKeysTable.revokedAt)));

  if (existingActive.count > 0) {
    return { error: "anApiKeyWithThisNameAlreadyExists", success: false };
  }

  // Check key limit for free users
  if (!isProUser(user)) {
    const [activeKeys] = await db
      .select({ count: count() })
      .from(apiKeysTable)
      .where(and(eq(apiKeysTable.userId, user.id), isNull(apiKeysTable.revokedAt)));

    if (activeKeys.count >= FREE_API_KEY_LIMIT) {
      return { error: "youveReachedTheApiKeyLimitUpgradeToProForUnlimitedKeys", success: false };
    }
  }

  // Check if name matches a revoked key (soft warning handled client-side)

  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = getKeyPrefix(rawKey);
  const keySuffix = getKeySuffix(rawKey);

  try {
    await db.insert(apiKeysTable).values({
      keyHash,
      keyPrefix,
      keySuffix,
      name: trimmedName,
      userId: user.id,
    });
  } catch {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  revalidatePath("/dashboard/api");

  return { rawKey, success: true };
}

export async function revokeApiKey(keyId: string): Promise<ActionResult> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [key] = await db
    .select()
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.id, keyId), eq(apiKeysTable.userId, user.id), isNull(apiKeysTable.revokedAt)))
    .limit(1);

  if (key == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  await db.update(apiKeysTable).set({ revokedAt: new Date() }).where(eq(apiKeysTable.id, keyId));

  revalidatePath("/dashboard/api");

  return { success: true };
}

export async function checkRevokedNameExists(name: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (user == null) {
    return false;
  }

  const [revoked] = await db
    .select({ count: count() })
    .from(apiKeysTable)
    .where(
      and(eq(apiKeysTable.userId, user.id), eq(apiKeysTable.name, name.trim()), isNotNull(apiKeysTable.revokedAt)),
    );

  return (revoked?.count ?? 0) > 0;
}
