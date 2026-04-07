import { db } from "@/lib/db/client";
import { accountDeletionLogsTable } from "@/lib/db/schema/account-deletion-log";
import { clicksTable } from "@/lib/db/schema/click";
import { customThemesTable } from "@/lib/db/schema/custom-theme";
import { linksTable } from "@/lib/db/schema/link";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { referralCodesTable } from "@/lib/db/schema/referral-code";
import { usersTable } from "@/lib/db/schema/user";
import { webhooksTable } from "@/lib/db/schema/webhook";
import { stripe } from "@/lib/stripe";
import { removeDomain } from "@/lib/vercel";
import { clerkClient } from "@clerk/nextjs/server";
import { and, count, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

export type AccountDeletionSummary = {
  accountAge: Date;
  clickCount: number;
  customDomain: null | string;
  groupCount: number;
  isPro: boolean;
  linkCount: number;
  webhookCount: number;
};

export async function getAccountDeletionSummary(userId: string): Promise<null | AccountDeletionSummary> {
  const [user] = await db
    .select({
      createdAt: usersTable.createdAt,
      customDomain: usersTable.customDomain,
      tier: usersTable.tier,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (user == null) {
    return null;
  }

  const [[links], [clicks], [groups], [webhooks]] = await Promise.all([
    db.select({ value: count() }).from(linksTable).where(eq(linksTable.userId, userId)),
    db.select({ value: count() }).from(clicksTable).where(eq(clicksTable.userId, userId)),
    db.select({ value: count() }).from(linkGroupsTable).where(eq(linkGroupsTable.userId, userId)),
    db.select({ value: count() }).from(webhooksTable).where(eq(webhooksTable.userId, userId)),
  ]);

  return {
    accountAge: user.createdAt,
    clickCount: clicks?.value ?? 0,
    customDomain: user.customDomain,
    groupCount: groups?.value ?? 0,
    isPro: user.tier === "pro",
    linkCount: links?.value ?? 0,
    webhookCount: webhooks?.value ?? 0,
  };
}

/** Collect UploadThing file keys from user avatar and custom theme backgrounds. */
async function collectUploadthingFileKeys(userId: string): Promise<string[]> {
  const keys: string[] = [];

  const [user] = await db
    .select({ avatarUrl: usersTable.avatarUrl, customAvatar: usersTable.customAvatar })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (user?.customAvatar && user.avatarUrl != null) {
    const key = extractFileKey(user.avatarUrl);
    if (key != null) {
      keys.push(key);
    }
  }

  const themes = await db
    .select({ backgroundImage: customThemesTable.backgroundImage })
    .from(customThemesTable)
    .where(eq(customThemesTable.userId, userId));

  for (const theme of themes) {
    if (theme.backgroundImage != null) {
      const key = extractFileKey(theme.backgroundImage);
      if (key != null) {
        keys.push(key);
      }
    }
  }

  return keys;
}

/** Extract UploadThing file key from a UFS URL. */
export function extractFileKey(url: string): null | string {
  try {
    const parsed = new URL(url);
    // UFS URLs look like: https://utfs.io/f/<fileKey> or https://<app>.ufs.sh/f/<fileKey>
    const segments = parsed.pathname.split("/");
    const fIndex = segments.indexOf("f");
    if (fIndex !== -1 && fIndex + 1 < segments.length) {
      return segments[fIndex + 1] || null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Delete UploadThing files by key. Returns true if successful. */
export async function deleteUploadthingFiles(fileKeys: string[]): Promise<boolean> {
  if (fileKeys.length === 0) {
    return true;
  }

  try {
    const utapi = new UTApi();
    await utapi.deleteFiles(fileKeys);
    return true;
  } catch (error) {
    console.error("[account-deletion] UploadThing cleanup failed:", error);
    return false;
  }
}

/** Cancel a Stripe subscription immediately. Returns true if successful. */
async function cancelStripeSubscription(subscriptionId: string): Promise<boolean> {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return true;
  } catch (error) {
    console.error("[account-deletion] Stripe cancel failed:", error);
    return false;
  }
}

/** Remove a Vercel custom domain. Returns true if successful. */
async function removeVercelDomain(domain: string): Promise<boolean> {
  try {
    await removeDomain(domain);
    return true;
  } catch (error) {
    console.error("[account-deletion] Vercel domain removal failed:", error);
    return false;
  }
}

/** Delete the user from Clerk. Returns true if successful. */
async function deleteClerkUser(clerkUserId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    await client.users.deleteUser(clerkUserId);
    return true;
  } catch (error) {
    console.error("[account-deletion] Clerk user deletion failed:", error);
    return false;
  }
}

export type DeleteAccountResult = { error: string; success: false } | { success: true };

/**
 * Permanently delete a user account and all associated data.
 * External service cleanup is best-effort; failures are tracked
 * in account_deletion_logs for the daily cron to retry.
 */
export async function deleteAccount(userId: string): Promise<DeleteAccountResult> {
  // 1. Fetch user data needed for cleanup
  const [user] = await db
    .select({
      avatarUrl: usersTable.avatarUrl,
      customAvatar: usersTable.customAvatar,
      customDomain: usersTable.customDomain,
      stripeCustomerId: usersTable.stripeCustomerId,
      stripeSubscriptionId: usersTable.stripeSubscriptionId,
      username: usersTable.username,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  // 2. Collect UploadThing file keys before cascade deletes custom_themes
  const uploadthingFileKeys = await collectUploadthingFileKeys(userId);

  // 3. Deactivate referral codes created by this user
  await db
    .update(referralCodesTable)
    .set({ active: false })
    .where(and(eq(referralCodesTable.creatorId, userId), eq(referralCodesTable.active, true)));

  // 4. Best-effort external cleanup
  let stripeCleaned = true;
  if (user.stripeSubscriptionId != null) {
    stripeCleaned = await cancelStripeSubscription(user.stripeSubscriptionId);
  }

  let vercelCleaned = true;
  if (user.customDomain != null) {
    vercelCleaned = await removeVercelDomain(user.customDomain);
  }

  const uploadthingCleaned = await deleteUploadthingFiles(uploadthingFileKeys);

  // 5. Insert deletion log (before DB cascade wipes user data)
  await db.insert(accountDeletionLogsTable).values({
    clerkCleaned: false, // Will be set after Clerk deletion
    clerkUserId: userId,
    customDomain: !vercelCleaned ? user.customDomain : null,
    stripeCleaned,
    stripeCustomerId: !stripeCleaned ? user.stripeCustomerId : null,
    stripeSubscriptionId: !stripeCleaned ? user.stripeSubscriptionId : null,
    uploadthingCleaned,
    uploadthingFileKeys: !uploadthingCleaned ? uploadthingFileKeys : null,
    username: user.username,
    vercelCleaned,
  });

  // 6. Delete user from DB (CASCADE handles all child tables)
  await db.delete(usersTable).where(eq(usersTable.id, userId));

  // 7. Delete from Clerk (best-effort)
  const clerkCleaned = await deleteClerkUser(userId);

  // 8. Update deletion log with Clerk status
  if (clerkCleaned) {
    // Check if all cleanup is done — if so, remove the log row entirely
    const allCleaned = stripeCleaned && vercelCleaned && uploadthingCleaned && clerkCleaned;
    if (allCleaned) {
      await db.delete(accountDeletionLogsTable).where(eq(accountDeletionLogsTable.clerkUserId, userId));
    } else {
      await db
        .update(accountDeletionLogsTable)
        .set({ clerkCleaned: true })
        .where(eq(accountDeletionLogsTable.clerkUserId, userId));
    }
  }

  return { success: true };
}
