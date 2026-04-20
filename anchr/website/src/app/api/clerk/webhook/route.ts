import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
import { envSchema } from "@/lib/env";
import { SIGNUP_GRANT_DAYS, grantPro } from "@/lib/tier.server";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { generateUsername } from "./utils";

// Emit a PostHog event from the webhook without forcing posthog-node into the
// client/edge bundles that import @/lib/db via shared modules. Import is lazy
// so build-time bundle analyzers don't trace through to the node-only SDK.
async function capturePosthog(distinctId: string, event: string, properties: Record<string, unknown>): Promise<void> {
  try {
    const { PostHog } = await import("posthog-node");
    const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "", {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    });
    posthog.capture({ distinctId, event, properties });
    await posthog.shutdown();
  } catch (error) {
    console.error(`[clerk webhook] PostHog capture failed for ${event}:`, error);
  }
}

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(envSchema.CLERK_WEBHOOK_SECRET);

  let event: WebhookEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-signature": svixSignature,
      "svix-timestamp": svixTimestamp,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "user.created": {
      const { email_addresses, first_name, id, image_url, last_name } = event.data;
      const email = email_addresses[0]?.email_address ?? "";
      const displayName = [first_name, last_name].filter(Boolean).join(" ") || null;
      const username = generateUsername(email, displayName);

      await db.insert(usersTable).values({
        avatarUrl: image_url ?? null,
        displayName,
        id,
        username,
      });

      // Every new signup gets an unconditional first month of Pro. `grantPro`
      // stacks via its CASE expression, so any referral-bonus grant that lands
      // before or after this call adds on top rather than overwriting.
      await grantPro(id, SIGNUP_GRANT_DAYS);
      await capturePosthog(id, "signup_grant_issued", { durationDays: SIGNUP_GRANT_DAYS });

      break;
    }

    case "user.updated": {
      const { first_name, id, image_url, last_name } = event.data;
      const displayName = [first_name, last_name].filter(Boolean).join(" ") || null;

      const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);

      if (existing == null) {
        break;
      }

      // Skip avatar/displayName sync when Nostr profile is active
      if (existing.useNostrProfile) {
        await db.update(usersTable).set({ updatedAt: new Date() }).where(eq(usersTable.id, id));
        break;
      }

      const updates: Partial<typeof usersTable.$inferInsert> = { updatedAt: new Date() };

      if (!existing.customAvatar) {
        updates.avatarUrl = image_url ?? null;
      }

      if (existing.displayName == null) {
        updates.displayName = displayName;
      }

      await db.update(usersTable).set(updates).where(eq(usersTable.id, id));

      break;
    }

    case "user.deleted": {
      const { id } = event.data;

      if (id != null) {
        await db.delete(usersTable).where(eq(usersTable.id, id));
      }

      break;
    }
  }

  return new Response("OK", { status: 200 });
}
