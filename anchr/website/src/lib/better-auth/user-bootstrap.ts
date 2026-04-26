import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
import { SIGNUP_GRANT_DAYS, grantPro } from "@/lib/tier.server";
import { eq } from "drizzle-orm";
import { generateUsername } from "./generate-username";

export { generateUsername };

// Bootstrap an application `users` row + signup-grant when a Better Auth user
// is created. Pre-cutover this lived in the Clerk webhook (`user.created`);
// post-cutover it runs as a BA database hook so the `users` row exists by the
// time the user lands on the dashboard.
//
// Idempotent: re-running with the same id is a no-op (the unique-id check
// short-circuits) so it's safe even if BA fires the create hook twice.

// Best-effort PostHog capture without forcing posthog-node into edge bundles.
// Identical pattern to the old Clerk webhook — lazy import keeps the SDK out
// of the auth-shared module graph.
async function capturePosthog(distinctId: string, event: string, properties: Record<string, unknown>): Promise<void> {
  try {
    const { PostHog } = await import("posthog-node");
    const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "", {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    });
    posthog.capture({ distinctId, event, properties });
    await posthog.shutdown();
  } catch (error) {
    console.error(`[user-bootstrap] PostHog capture failed for ${event}:`, error);
  }
}

export async function bootstrapApplicationUser(input: {
  email: string;
  id: string;
  image?: null | string;
  name?: null | string;
}): Promise<void> {
  const { email, id, image, name } = input;

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (existing != null) {
    return;
  }

  const username = generateUsername(email, name ?? null);

  await db.insert(usersTable).values({
    avatarUrl: image ?? null,
    displayName: name ?? null,
    id,
    username,
  });

  // Every new sign-up gets an unconditional first month of Pro. `grantPro`
  // stacks via its CASE expression, so any referral-bonus grant that lands
  // before or after this call adds on top rather than overwriting.
  await grantPro(id, SIGNUP_GRANT_DAYS);
  await capturePosthog(id, "signup_grant_issued", { durationDays: SIGNUP_GRANT_DAYS });
}
