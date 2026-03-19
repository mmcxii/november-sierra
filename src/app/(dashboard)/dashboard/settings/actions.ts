"use server";

import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
import { envSchema } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { isDarkTheme, isValidThemeId } from "@/lib/themes";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string; success: false } | { success: true; url?: string };

async function updatePageTheme(field: "pageDarkTheme" | "pageLightTheme", theme: string): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (!isValidThemeId(theme)) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db
    .update(usersTable)
    .set({ [field]: theme, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning({ username: usersTable.username });

  if (user?.username) {
    revalidatePath(`/${user.username}`);
  }

  return { success: true };
}

export async function updatePageDarkTheme(theme: string): Promise<ActionResult> {
  if (!isValidThemeId(theme) || !isDarkTheme(theme)) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  return updatePageTheme("pageDarkTheme", theme);
}

export async function updatePageLightTheme(theme: string): Promise<ActionResult> {
  if (!isValidThemeId(theme) || isDarkTheme(theme)) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  return updatePageTheme("pageLightTheme", theme);
}

export async function updateHideBranding(hide: boolean): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user == null || user.tier !== "pro") {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  await db.update(usersTable).set({ hideBranding: hide, updatedAt: new Date() }).where(eq(usersTable.id, userId));

  if (user.username) {
    revalidatePath(`/${user.username}`);
  }

  return { success: true };
}

export async function createCheckoutSession(): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      client_reference_id: userId,
      ...(user.stripeCustomerId != null && { customer: user.stripeCustomerId }),
      cancel_url: `${envSchema.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
      line_items: [{ price: envSchema.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      mode: "subscription",
      success_url: `${envSchema.NEXT_PUBLIC_APP_URL}/dashboard/settings?checkout=success`,
    });

    if (session.url == null) {
      return { error: "somethingWentWrongPleaseTryAgain", success: false };
    }

    return { success: true, url: session.url };
  } catch (error) {
    console.error("[createCheckoutSession]", error);
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }
}

export async function createPortalSession(): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user?.stripeCustomerId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${envSchema.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    });

    return { success: true, url: session.url };
  } catch (error) {
    console.error("[createPortalSession]", error);
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }
}
