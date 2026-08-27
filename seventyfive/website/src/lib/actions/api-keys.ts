"use server";

import {
  API_KEY_LIMIT,
  generateApiKey,
  getKeyPrefix,
  getKeySuffix,
  hashApiKey,
  isValidApiKeyName,
} from "@/lib/api-keys";
import { getAuthUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { apiKeysTable } from "@/lib/db/schema";
import { newId } from "@/lib/utils";
import { and, count, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type CreateApiKeyResult = { error: string } | { ok: true; rawKey: string };
export type RevokeApiKeyResult = { error: string } | { ok: true };

export async function createApiKeyAction(name: string): Promise<CreateApiKeyResult> {
  const user = await getAuthUser();
  if (user == null) {
    return { error: "somethingWentWrong" };
  }

  const trimmedName = name.trim();
  if (!isValidApiKeyName(trimmedName)) {
    return { error: "invalidApiKeyNameUseLettersNumbersSpacesHyphensOrUnderscoresMax64Characters" };
  }

  const [existingActive] = await db
    .select({ count: count() })
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.userId, user.id), eq(apiKeysTable.name, trimmedName), isNull(apiKeysTable.revokedAt)));

  if ((existingActive?.count ?? 0) > 0) {
    return { error: "anApiKeyWithThisNameAlreadyExists" };
  }

  const [activeKeys] = await db
    .select({ count: count() })
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.userId, user.id), isNull(apiKeysTable.revokedAt)));

  if ((activeKeys?.count ?? 0) >= API_KEY_LIMIT) {
    return { error: "youveReachedTheApiKeyLimit" };
  }

  const rawKey = generateApiKey();
  await db.insert(apiKeysTable).values({
    id: newId(),
    keyHash: hashApiKey(rawKey),
    keyPrefix: getKeyPrefix(rawKey),
    keySuffix: getKeySuffix(rawKey),
    name: trimmedName,
    userId: user.id,
  });

  revalidatePath("/settings");
  return { ok: true, rawKey };
}

export async function revokeApiKeyAction(keyId: string): Promise<RevokeApiKeyResult> {
  const user = await getAuthUser();
  if (user == null) {
    return { error: "somethingWentWrong" };
  }

  const [key] = await db
    .select()
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.id, keyId), eq(apiKeysTable.userId, user.id), isNull(apiKeysTable.revokedAt)))
    .limit(1);

  if (key == null) {
    return { error: "somethingWentWrong" };
  }

  await db.update(apiKeysTable).set({ revokedAt: new Date() }).where(eq(apiKeysTable.id, keyId));
  revalidatePath("/settings");
  return { ok: true };
}
