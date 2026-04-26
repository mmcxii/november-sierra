import { db } from "@/lib/db/client";
import { accountDeletionLogsTable } from "@/lib/db/schema/account-deletion-log";
import { betterAuthUserTable } from "@/lib/db/schema/better-auth";
import { deleteUploadthingFiles } from "@/lib/services/account-deletion";
import { stripe } from "@/lib/stripe";
import { removeDomain } from "@/lib/vercel";
import { eq } from "drizzle-orm";

const MAX_ATTEMPTS = 3;

export type CleanupResult = {
  alerted: number;
  failed: number;
  resolved: number;
  retried: number;
};

/**
 * Retry unresolved account deletion cleanup tasks.
 * Called by the daily cron. After MAX_ATTEMPTS failures,
 * fires a PostHog event for admin alerting.
 */
export async function retryDeletionCleanup(): Promise<CleanupResult> {
  const pending = await db.select().from(accountDeletionLogsTable);

  const result: CleanupResult = { alerted: 0, failed: 0, resolved: 0, retried: 0 };
  const failuresToReport: { clerkUserId: string; status: Record<string, boolean>; username: string }[] = [];

  for (const log of pending) {
    result.retried++;

    let { clerkCleaned, stripeCleaned, uploadthingCleaned, vercelCleaned } = log;

    // Retry Stripe
    if (!stripeCleaned && log.stripeSubscriptionId != null) {
      try {
        await stripe.subscriptions.cancel(log.stripeSubscriptionId);
        stripeCleaned = true;
      } catch (error) {
        console.error(`[deletion-cleanup] Stripe retry failed for ${log.username}:`, error);
      }
    } else if (!stripeCleaned) {
      stripeCleaned = true; // No subscription to cancel
    }

    // Retry Vercel
    if (!vercelCleaned && log.customDomain != null) {
      try {
        await removeDomain(log.customDomain);
        vercelCleaned = true;
      } catch (error) {
        console.error(`[deletion-cleanup] Vercel retry failed for ${log.username}:`, error);
      }
    } else if (!vercelCleaned) {
      vercelCleaned = true; // No domain to remove
    }

    // Retry UploadThing
    if (!uploadthingCleaned && log.uploadthingFileKeys != null && (log.uploadthingFileKeys as string[]).length > 0) {
      uploadthingCleaned = await deleteUploadthingFiles(log.uploadthingFileKeys as string[]);
    } else if (!uploadthingCleaned) {
      uploadthingCleaned = true; // No files to delete
    }

    // Retry Better Auth identity row delete (column kept as `clerkCleaned`
    // pre-rename to avoid a schema migration in this PR).
    if (!clerkCleaned) {
      try {
        await db.delete(betterAuthUserTable).where(eq(betterAuthUserTable.id, log.clerkUserId));
        clerkCleaned = true;
      } catch (error) {
        console.error(`[deletion-cleanup] Better Auth retry failed for ${log.username}:`, error);
      }
    }

    const allCleaned = stripeCleaned && vercelCleaned && uploadthingCleaned && clerkCleaned;
    const newAttempts = log.attempts + 1;

    if (allCleaned) {
      // Fully resolved — delete the log row (frees the username)
      await db.delete(accountDeletionLogsTable).where(eq(accountDeletionLogsTable.id, log.id));
      result.resolved++;
    } else {
      // Update progress
      await db
        .update(accountDeletionLogsTable)
        .set({
          attempts: newAttempts,
          clerkCleaned,
          lastAttemptAt: new Date(),
          stripeCleaned,
          uploadthingCleaned,
          vercelCleaned,
        })
        .where(eq(accountDeletionLogsTable.id, log.id));

      if (newAttempts === MAX_ATTEMPTS) {
        failuresToReport.push({
          clerkUserId: log.clerkUserId,
          status: { clerkCleaned, stripeCleaned, uploadthingCleaned, vercelCleaned },
          username: log.username,
        });
        result.alerted++;
      }

      result.failed++;
    }
  }

  if (failuresToReport.length > 0) {
    await reportCleanupFailures(failuresToReport);
  }

  return result;
}

async function reportCleanupFailures(
  failures: { clerkUserId: string; status: Record<string, boolean>; username: string }[],
): Promise<void> {
  try {
    // Dynamic import to avoid pulling PostHog into non-browser bundles
    const { PostHog } = await import("posthog-node");
    const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "", {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    });

    for (const failure of failures) {
      posthog.capture({
        distinctId: "system",
        event: "account_deletion_cleanup_failed",
        properties: {
          clerkUserId: failure.clerkUserId,
          status: failure.status,
          username: failure.username,
        },
      });
    }

    await posthog.shutdown();
  } catch (error) {
    console.error("[deletion-cleanup] PostHog alert failed:", error);
  }
}
