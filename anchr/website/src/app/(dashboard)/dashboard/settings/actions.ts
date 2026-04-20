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
import { isNpub } from "@/lib/nostr";
import { isValidRelayUrl, MAX_RELAYS, type NostrProfileData } from "@/lib/nostr-profile";
import { fetchNostrProfile } from "@/lib/nostr-profile.server";
import { deleteAccount, getAccountDeletionSummary } from "@/lib/services/account-deletion";
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

export type ActionResult =
  | {
      /**
       * Human-readable server-side detail (e.g. a Stripe error message),
       * intended for debugging and captured by smoke tests via
       * console.error. Never rendered to end users — the translated
       * `error` key is what the UI shows. Truncated to 500 chars by
       * convention so we don't leak anything sensitive.
       */
      debug?: string;
      error: string;
      success: false;
    }
  | { success: true; url?: string };

type RedeemReferralCodeResult =
  | { durationDays: null | number; referrerName: null | string; success: true }
  | { error: string; success: false };

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

export type CheckoutInterval = "annual" | "monthly";

/**
 * Create a Stripe checkout session for the Pro plan at the requested
 * billing interval. The interval determines which Stripe price id is
 * billed; the marketing pricing page lets users pick, the dashboard
 * upgrade buttons default to monthly via the hook caller.
 */
export async function createCheckoutSession(interval: CheckoutInterval = "monthly"): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { debug: "no authenticated user", error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user == null) {
    return {
      debug: `no users row for userId=${userId}`,
      error: "somethingWentWrongPleaseTryAgain",
      success: false,
    };
  }

  const priceId = interval === "annual" ? envSchema.STRIPE_PRO_PRICE_ID_ANNUAL : envSchema.STRIPE_PRO_PRICE_ID_MONTHLY;

  // Honor any remaining signup/referral Pro grant by delaying the first Stripe
  // charge until the grant's natural expiry. Without this, a user who upgrades
  // on day 10 of their free month would forfeit the remaining 20 days — paying
  // early would cost them time, which breaks the "your first month is free"
  // marketing promise. The `trial_end` Unix timestamp is only set when the
  // user has unexpired grant time on the clock.
  const trialEnd =
    user.proExpiresAt != null && user.proExpiresAt.getTime() > Date.now()
      ? Math.floor(user.proExpiresAt.getTime() / 1000)
      : undefined;

  try {
    const session = await stripe.checkout.sessions.create({
      client_reference_id: userId,
      ...(user.stripeCustomerId != null && { customer: user.stripeCustomerId }),
      cancel_url: `${envSchema.NEXT_PUBLIC_APP_URL}/dashboard/settings?checkout=cancelled`,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      ...(trialEnd != null && { subscription_data: { trial_end: trialEnd } }),
      success_url: `${envSchema.NEXT_PUBLIC_APP_URL}/dashboard/settings?checkout=success`,
    });

    if (session.url == null) {
      return {
        debug: "stripe.checkout.sessions.create returned session with no url",
        error: "somethingWentWrongPleaseTryAgain",
        success: false,
      };
    }

    return { success: true, url: session.url };
  } catch (error) {
    console.error("[createCheckoutSession]", error);
    return {
      debug: stripeErrorDetail(error),
      error: "somethingWentWrongPleaseTryAgain",
      success: false,
    };
  }
}

export async function createPortalSession(): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { debug: "no authenticated user", error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user?.stripeCustomerId == null) {
    return {
      debug: `no stripeCustomerId for userId=${userId}`,
      error: "somethingWentWrongPleaseTryAgain",
      success: false,
    };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${envSchema.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    });

    return { success: true, url: session.url };
  } catch (error) {
    console.error("[createPortalSession]", error);
    return {
      debug: stripeErrorDetail(error),
      error: "somethingWentWrongPleaseTryAgain",
      success: false,
    };
  }
}

/**
 * Extract a compact, developer-facing summary of a Stripe error. Truncated
 * to 500 chars and intentionally excludes any field that could contain
 * sensitive data; Stripe error messages are safe to surface in the browser
 * console for smoke-test observability.
 */
function stripeErrorDetail(error: unknown): string {
  if (error == null) {
    return "unknown error";
  }
  if (typeof error === "object" && error != null) {
    const e = error as { code?: string; message?: string; statusCode?: number; type?: string };
    const parts = [e.type, e.code, e.statusCode != null ? `status=${e.statusCode}` : null, e.message]
      .filter((p): p is string => p != null && p !== "")
      .join(" | ");
    if (parts !== "") {
      return parts.slice(0, 500);
    }
  }
  return String(error).slice(0, 500);
}

export async function updateProfile(displayName: string, bio: string): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [existing] = await db
    .select({ useNostrProfile: usersTable.useNostrProfile })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (existing?.useNostrProfile) {
    return { error: "disconnectYourNostrProfileToEditManually", success: false };
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

  const [existing] = await db
    .select({ useNostrProfile: usersTable.useNostrProfile })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (existing?.useNostrProfile) {
    return { error: "disconnectYourNostrProfileToEditManually", success: false };
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

// ─── Nostr Profile Actions ──────────────────────────────────────────────────

export type NostrPreviewResult = { data: NostrProfileData; success: true } | { error: string; success: false };

export async function fetchNostrPreview(npub: string, relays: string[]): Promise<NostrPreviewResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const trimmedNpub = npub.trim();

  if (!isNpub(trimmedNpub)) {
    return { error: "pleaseEnterAValidNpub", success: false };
  }

  const validRelays = relays.filter((r) => isValidRelayUrl(r.trim()));

  if (validRelays.length === 0) {
    return { error: "pleaseAddAtLeastOneRelay", success: false };
  }

  if (validRelays.length > MAX_RELAYS) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const data = await fetchNostrProfile(trimmedNpub, validRelays);

  if (data == null) {
    return { error: "couldNotFetchNostrProfilePleaseTryAgainOrCheckYourRelays", success: false };
  }

  return { data, success: true };
}

export async function saveNostrProfile(
  npub: string,
  relays: string[],
  profileData: NostrProfileData,
): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const trimmedNpub = npub.trim();

  if (!isNpub(trimmedNpub)) {
    return { error: "pleaseEnterAValidNpub", success: false };
  }

  const validRelays = relays.filter((r) => isValidRelayUrl(r.trim()));

  if (validRelays.length === 0) {
    return { error: "pleaseAddAtLeastOneRelay", success: false };
  }

  const [user] = await db
    .update(usersTable)
    .set({
      avatarUrl: profileData.picture,
      bio: profileData.about,
      customAvatar: profileData.picture != null,
      displayName: profileData.displayName,
      nostrNpub: trimmedNpub,
      nostrProfileFetchedAt: new Date(),
      nostrRelays: JSON.stringify(validRelays),
      updatedAt: new Date(),
      useNostrProfile: true,
    })
    .where(eq(usersTable.id, userId))
    .returning({ username: usersTable.username });

  revalidatePath("/dashboard/settings");
  if (user?.username) {
    revalidatePath(`/${user.username}`);
  }

  return { success: true };
}

export async function disconnectNostrProfile(): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db
    .update(usersTable)
    .set({
      nostrNpub: null,
      nostrProfileFetchedAt: null,
      nostrRelays: null,
      updatedAt: new Date(),
      useNostrProfile: false,
    })
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

  // Check if the domain is in use by another user — on either the profile
  // (custom_domain) or short-URL (short_domain) column. A domain can only
  // route to one Anchr profile or its short-URL namespace; accepting this
  // here would lead to a Vercel add-domain conflict or a middleware resolver
  // ambiguity.
  const [profileCollision] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.customDomain, normalized), ne(usersTable.id, userId)))
    .limit(1);

  if (profileCollision != null) {
    return { error: "thisDomainIsAlreadyInUse", success: false };
  }

  const [shortCollision] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.shortDomain, normalized), ne(usersTable.id, userId)))
    .limit(1);

  if (shortCollision != null) {
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

// ─── Custom Short Domain Actions ─────────────────────────────────────────────
//
// The short-URL custom domain (users.short_domain) mirrors the profile custom
// domain (users.custom_domain) pattern: add → DNS-pending → verify via Vercel
// → verified. Gated behind Pro and behind Vercel project domain provisioning.
// Short domains without short_domain_verified=true are ignored by the short-URL
// resolution middleware (see src/middleware.ts resolveShortDomain), which
// ensures an unverified domain can't be used to hijack short-URL resolution.

export async function addShortDomain(domain: string): Promise<ActionResult> {
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

  // Refuse collisions across either custom_domain or short_domain columns on
  // any other user — a domain can only route to one Anchr profile or its
  // short-URL namespace.
  const [profileCollision] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.customDomain, normalized), ne(usersTable.id, userId)))
    .limit(1);

  if (profileCollision != null) {
    return { error: "thisDomainIsAlreadyInUse", success: false };
  }

  const [shortCollision] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.shortDomain, normalized), ne(usersTable.id, userId)))
    .limit(1);

  if (shortCollision != null) {
    return { error: "thisDomainIsAlreadyInUse", success: false };
  }

  // If user already has a different short domain, remove it from Vercel first.
  if (user.shortDomain != null && user.shortDomain !== normalized) {
    await removeDomain(user.shortDomain);
  }

  const result = await addDomain(normalized);

  if (!result.ok) {
    console.error("[addShortDomain]", result.error);
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  await db
    .update(usersTable)
    .set({ shortDomain: normalized, shortDomainVerified: false, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  revalidatePath("/dashboard/settings");

  return { success: true };
}

export async function verifyShortDomain(): Promise<VerifyDomainResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", status: "error", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user == null || user.shortDomain == null) {
    return { error: "somethingWentWrongPleaseTryAgain", status: "error", success: false };
  }

  const configResult = await getDomainConfig(user.shortDomain);

  if (!configResult.ok || configResult.data.misconfigured) {
    return { error: "dnsNotConfiguredYetPleaseAddTheCnameRecordAndTryAgain", status: "error", success: false };
  }

  const verifyResult = await verifyDomain(user.shortDomain);

  if (!verifyResult.ok || !verifyResult.data.verified) {
    return { error: "sslIsBeingProvisionedPleaseWaitAFewMinutesAndTryAgain", status: "error", success: false };
  }

  await db
    .update(usersTable)
    .set({ shortDomainVerified: true, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  revalidatePath("/dashboard/settings");

  return { status: "connected", success: true };
}

export async function removeShortDomain(): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user == null || user.shortDomain == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  await removeDomain(user.shortDomain);

  await db
    .update(usersTable)
    .set({ shortDomain: null, shortDomainVerified: false, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  revalidatePath("/dashboard/settings");

  return { success: true };
}

// ─── Referral Code Actions ──────────────────────────────────────────────────

export async function redeemReferralCode(code: string): Promise<RedeemReferralCodeResult> {
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

  // Collusion prevention: each user may only redeem one user-type code, ever.
  // Admin/promotional codes are unaffected by this limit.
  if (referralCode.type === "user") {
    const [priorUserCodeRedemption] = await db
      .select({ id: referralRedemptionsTable.id })
      .from(referralRedemptionsTable)
      .innerJoin(referralCodesTable, eq(referralRedemptionsTable.codeId, referralCodesTable.id))
      .where(and(eq(referralRedemptionsTable.userId, userId), eq(referralCodesTable.type, "user")))
      .limit(1);

    if (priorUserCodeRedemption != null) {
      return {
        error: "youHaveAlreadyRedeemedAnotherUsersReferralCodePromotionalCodesCanStillBeRedeemed",
        success: false,
      };
    }
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

  // Resolve referrer display name for user-type codes
  let referrerName: null | string = null;
  if (referralCode.type === "user" && referralCode.creatorId != null) {
    const [creator] = await db
      .select({ displayName: usersTable.displayName, username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, referralCode.creatorId))
      .limit(1);
    referrerName = creator?.displayName ?? creator?.username ?? null;
  }

  return { durationDays: referralCode.durationDays, referrerName, success: true };
}

export type ReferralCodeResult = { code: string; success: true } | { error: string; success: false };

// ─── Account Deletion Actions ─────────��────────────────────────────────────

export type { AccountDeletionSummary } from "@/lib/services/account-deletion";

export async function fetchAccountDeletionSummary() {
  const { userId } = await auth();

  if (userId == null) {
    return null;
  }

  return getAccountDeletionSummary(userId);
}

export async function deleteMyAccount(): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const result = await deleteAccount(userId);

  if (!result.success) {
    return { error: result.error, success: false };
  }

  return { success: true };
}

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

// ─── Billing Banner Actions ────────────────────────────────────────────────

/**
 * Dismiss the "your custom domain was removed" dashboard banner by
 * clearing `domainRemovedAt`. Called when the user clicks the X button.
 */
export async function dismissDomainRemovedBanner(): Promise<ActionResult> {
  const { userId } = await auth();

  if (userId == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  await db.update(usersTable).set({ domainRemovedAt: null, updatedAt: new Date() }).where(eq(usersTable.id, userId));

  revalidatePath("/dashboard");

  return { success: true };
}
