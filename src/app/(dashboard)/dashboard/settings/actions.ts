"use server";

import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  checkUsernameAvailability as checkUsernameAvailabilityQuery,
  updateUsername as updateUsernameQuery,
} from "@/lib/db/queries/username";
import { referralCodesTable } from "@/lib/db/schema/referral-code";
import { referralRedemptionsTable } from "@/lib/db/schema/referral-redemption";
import { usersTable } from "@/lib/db/schema/user";
import { envSchema } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { isDarkTheme, isValidThemeId } from "@/lib/themes";
import { isProUser } from "@/lib/tier";
import { grantPro } from "@/lib/tier.server";
import { generateReferralCode } from "@/lib/utils/referral-code";
import { isValidDomain } from "@/lib/utils/url";
import { addDomain, getDomainConfig, removeDomain, verifyDomain } from "@/lib/vercel";
import { auth } from "@clerk/nextjs/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string; success: false } | { success: true; url?: string };

// ─── Username Actions ───────────────────────────────────────────────────────

export type { CheckUsernameResult } from "@/lib/db/queries/username";

export async function checkUsernameAvailability(username: string) {
  const { userId } = await auth();

  if (userId == null) {
    return { available: false };
  }

  return checkUsernameAvailabilityQuery(userId, username);
}

export async function updateUsername(username: string): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const result = await updateUsernameQuery(userId, username);

  if (!result.success) {
    return { error: result.error, success: false };
  }

  if (result.oldUsername != null) {
    revalidatePath(`/${result.oldUsername}`);
  }

  revalidatePath(`/${username}`);
  revalidatePath("/dashboard/settings");

  return { success: true };
}

// ─── Theme Actions ──────────────────────────────────────────────────────────

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

  if (user == null || !isProUser(user)) {
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

export async function updateProfile(displayName: string, bio: string): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const trimmedDisplayName = displayName.trim();
  const trimmedBio = bio.trim();

  const [user] = await db
    .update(usersTable)
    .set({
      bio: trimmedBio.length > 0 ? trimmedBio : null,
      displayName: trimmedDisplayName.length > 0 ? trimmedDisplayName : null,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, userId))
    .returning({ username: usersTable.username });

  revalidatePath("/dashboard/settings");
  if (user?.username) {
    revalidatePath(`/${user.username}`);
  }

  return { success: true };
}

export async function removeAvatar(): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db
    .update(usersTable)
    .set({ avatarUrl: null, customAvatar: false, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning({ username: usersTable.username });

  revalidatePath("/dashboard/settings");
  if (user?.username) {
    revalidatePath(`/${user.username}`);
  }

  return { success: true };
}

// ─── Custom Domain Actions ───────────────────────────────────────────────────

export type VerifyDomainResult =
  | { error: string; status: "error"; success: false }
  | { status: "connected" | "dns_pending" | "ssl_pending"; success: true };

export async function addCustomDomain(domain: string): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user == null || !isProUser(user)) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const normalized = domain.trim().toLowerCase();

  if (!isValidDomain(normalized)) {
    return { error: "pleaseEnterAValidUrl", success: false };
  }

  // Check if domain is already used by another user
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.customDomain, normalized), ne(usersTable.id, userId)))
    .limit(1);

  if (existing != null) {
    return { error: "thisDomainIsAlreadyInUse", success: false };
  }

  // If user already has a different domain, remove it from Vercel first
  if (user.customDomain != null && user.customDomain !== normalized) {
    await removeDomain(user.customDomain);
  }

  const result = await addDomain(normalized);

  if (!result.ok) {
    console.error("[addCustomDomain]", result.error);
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  await db
    .update(usersTable)
    .set({ customDomain: normalized, customDomainVerified: false, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  revalidatePath("/dashboard/settings");

  return { success: true };
}

export async function verifyCustomDomain(): Promise<VerifyDomainResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", status: "error", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user == null || user.customDomain == null) {
    return { error: "somethingWentWrongPleaseTryAgain", status: "error", success: false };
  }

  const configResult = await getDomainConfig(user.customDomain);

  if (!configResult.ok || configResult.data.misconfigured) {
    return { error: "dnsNotConfiguredYetPleaseAddTheCnameRecordAndTryAgain", status: "error", success: false };
  }

  const verifyResult = await verifyDomain(user.customDomain);

  if (!verifyResult.ok || !verifyResult.data.verified) {
    return { error: "sslIsBeingProvisionedPleaseWaitAFewMinutesAndTryAgain", status: "error", success: false };
  }

  await db
    .update(usersTable)
    .set({ customDomainVerified: true, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  revalidatePath("/dashboard/settings");
  if (user.username) {
    revalidatePath(`/${user.username}`);
  }

  return { status: "connected", success: true };
}

export async function removeCustomDomain(): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user == null || user.customDomain == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  await removeDomain(user.customDomain);

  await db
    .update(usersTable)
    .set({ customDomain: null, customDomainVerified: false, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  revalidatePath("/dashboard/settings");
  if (user.username) {
    revalidatePath(`/${user.username}`);
  }

  return { success: true };
}

// ─── Referral Code Actions ──────────────────────────────────────────────────

export async function redeemReferralCode(code: string): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const normalized = code.trim().toUpperCase();

  const [referralCode] = await db
    .select()
    .from(referralCodesTable)
    .where(eq(referralCodesTable.code, normalized))
    .limit(1);

  if (referralCode == null) {
    return { error: "invalidReferralCode", success: false };
  }

  // Check if code is deactivated
  if (!referralCode.active) {
    return { error: "thisReferralCodeIsNoLongerActive", success: false };
  }

  // Check if code is expired
  if (referralCode.expiresAt != null && referralCode.expiresAt < new Date()) {
    return { error: "thisReferralCodeHasExpired", success: false };
  }

  // Prevent self-redemption (admins are exempt)
  if (referralCode.creatorId === userId && !isAdmin(userId)) {
    return { error: "youCannotRedeemYourOwnReferralCode", success: false };
  }

  // Check max redemptions
  if (referralCode.maxRedemptions != null && referralCode.currentRedemptions >= referralCode.maxRedemptions) {
    return { error: "thisReferralCodeHasAlreadyBeenUsed", success: false };
  }

  // Check if user already redeemed this code
  const [existing] = await db
    .select({ id: referralRedemptionsTable.id })
    .from(referralRedemptionsTable)
    .where(and(eq(referralRedemptionsTable.codeId, referralCode.id), eq(referralRedemptionsTable.userId, userId)))
    .limit(1);

  if (existing != null) {
    return { error: "youHaveAlreadyRedeemedThisCode", success: false };
  }

  // Insert redemption and increment counter
  await db.insert(referralRedemptionsTable).values({
    codeId: referralCode.id,
    userId,
  });

  await db
    .update(referralCodesTable)
    .set({ currentRedemptions: sql`${referralCodesTable.currentRedemptions} + 1` })
    .where(eq(referralCodesTable.id, referralCode.id));

  // Grant Pro
  await grantPro(userId, referralCode.durationDays);

  // If user referral code, set referredBy for Stripe reward
  if (referralCode.type === "user" && referralCode.creatorId != null) {
    await db
      .update(usersTable)
      .set({ referredBy: referralCode.creatorId, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));
  }

  // Apply reserved username if set (re-check availability to prevent race conditions)
  if (referralCode.reservedUsername != null) {
    const [takenByUser] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, referralCode.reservedUsername))
      .limit(1);

    if (takenByUser == null) {
      const [currentUser] = await db
        .select({ username: usersTable.username })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      const oldUsername = currentUser?.username;

      await db
        .update(usersTable)
        .set({ updatedAt: new Date(), username: referralCode.reservedUsername })
        .where(eq(usersTable.id, userId));

      if (oldUsername != null) {
        revalidatePath(`/${oldUsername}`);
      }

      revalidatePath(`/${referralCode.reservedUsername}`);
    }
  }

  revalidatePath("/dashboard/settings");

  return { success: true };
}

export type ReferralCodeResult = { code: string; success: true } | { error: string; success: false };

export async function getOrCreateUserReferralCode(): Promise<ReferralCodeResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  // Check if user already has a referral code
  const [existing] = await db
    .select({ code: referralCodesTable.code })
    .from(referralCodesTable)
    .where(and(eq(referralCodesTable.creatorId, userId), eq(referralCodesTable.type, "user")))
    .limit(1);

  if (existing != null) {
    return { code: existing.code, success: true };
  }

  const code = generateReferralCode("ANCHR");

  await db.insert(referralCodesTable).values({
    code,
    creatorId: userId,
    durationDays: 30,
    maxRedemptions: null,
    type: "user",
  });

  return { code, success: true };
}
