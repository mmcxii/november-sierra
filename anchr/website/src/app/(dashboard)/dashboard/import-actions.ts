"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { generateUniqueSlug } from "@/lib/db/queries/link";
import { linksTable } from "@/lib/db/schema/link";
import { referralCodesTable } from "@/lib/db/schema/referral-code";
import { referralRedemptionsTable } from "@/lib/db/schema/referral-redemption";
import { type UserPreferences, usersTable } from "@/lib/db/schema/user";
import { parsePage } from "@/lib/import/parse";
import type { ImportedLink, ImportedPage, ImportedProfile } from "@/lib/import/types";
import { detectPlatform } from "@/lib/platforms";
import { assignBioLinkShortSlug } from "@/lib/services/bio-link-short-slug";
import { grantPro } from "@/lib/tier.server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./actions";

const FETCH_TIMEOUT_MS = 5000;
const IMPORT_PRO_DAYS = 30;

// ─── Types ───────────────────────────────────────────────────────────────────

export type ScrapeResult = { error: string; success: false } | { page: ImportedPage; success: true };

export type ConfirmImportInput = {
  links: ImportedLink[];
  profile: {
    applyAvatar: boolean;
    applyBio: boolean;
    applyDisplayName: boolean;
    data: ImportedProfile;
  };
};

export type ImportResultData = {
  importedCount: number;
  proGranted: boolean;
  referrerName: null | string;
  totalProDays: number;
};

export type ConfirmImportResult = (ImportResultData & { success: true }) | { error: string; success: false };

// ─── Scrape ──────────────────────────────────────────────────────────────────

function isValidImportUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function scrapeImportUrl(url: string): Promise<ScrapeResult> {
  const user = await getCurrentUser();
  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const trimmed = url.trim();
  const fullUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  if (!isValidImportUrl(fullUrl)) {
    return { error: "pleaseEnterAValidUrl", success: false };
  }

  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(fullUrl, {
      headers: {
        Accept: "text/html",
        "User-Agent": "AnchrBot/1.0 (+https://anchr.to)",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 404) {
        return { error: "thatPageDoesntSeemToExist", success: false };
      }
      return { error: "couldntReachThatPageCheckTheUrlAndTryAgain", success: false };
    }

    html = await response.text();
  } catch {
    return { error: "couldntReachThatPageCheckTheUrlAndTryAgain", success: false };
  }

  const page = parsePage(html, fullUrl);

  if (page.links.length === 0) {
    return { error: "weCouldntFindAnyLinksOnThatPage", success: false };
  }

  return { page, success: true };
}

// ─── Confirm Import ──────────────────────────────────────────────────────────

async function hasRedeemedImportMigration(userId: string): Promise<boolean> {
  const result = await db
    .select({ id: referralRedemptionsTable.id })
    .from(referralRedemptionsTable)
    .innerJoin(referralCodesTable, eq(referralRedemptionsTable.codeId, referralCodesTable.id))
    .where(and(eq(referralRedemptionsTable.userId, userId), eq(referralCodesTable.reason, "import-migration")))
    .limit(1);

  return result.length > 0;
}

async function grantImportPro(userId: string): Promise<void> {
  // Create single-use admin referral code tagged with reason
  const code = `IMPORT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const [created] = await db
    .insert(referralCodesTable)
    .values({
      code,
      durationDays: IMPORT_PRO_DAYS,
      maxRedemptions: 1,
      note: "Auto-generated for platform import migration",
      reason: "import-migration",
      type: "admin",
    })
    .returning({ id: referralCodesTable.id });

  // Auto-redeem
  await db.insert(referralRedemptionsTable).values({
    codeId: created.id,
    userId,
  });

  await db
    .update(referralCodesTable)
    .set({ currentRedemptions: sql`${referralCodesTable.currentRedemptions} + 1` })
    .where(eq(referralCodesTable.id, created.id));

  await grantPro(userId, IMPORT_PRO_DAYS);
}

export async function confirmImport(input: ConfirmImportInput): Promise<ConfirmImportResult> {
  const user = await getCurrentUser();
  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (input.links.length === 0) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  // Deduplicate against existing links by URL
  const existingLinks = await db.select({ url: linksTable.url }).from(linksTable).where(eq(linksTable.userId, user.id));

  const existingUrls = new Set(existingLinks.map((l) => l.url.toLowerCase()));
  const newLinks = input.links.filter((l) => !existingUrls.has(l.url.toLowerCase()));

  if (newLinks.length === 0) {
    return { error: "allOfTheseLinksAreAlreadyOnYourPage", success: false };
  }

  // Grant import Pro if not already granted (stacks with existing referral Pro)
  let proGranted = false;
  const alreadyRedeemed = await hasRedeemedImportMigration(user.id);

  if (!alreadyRedeemed) {
    await grantImportPro(user.id);
    proGranted = true;
  }

  // Get current max position
  const [{ max: maxPos }] = await db
    .select({ max: sql<number>`coalesce(max(${linksTable.position}), -1)` })
    .from(linksTable)
    .where(eq(linksTable.userId, user.id));

  // Bulk insert links
  const linkValues = await Promise.all(
    newLinks.map(async (link, i) => ({
      id: crypto.randomUUID(),
      platform: detectPlatform(link.url),
      position: maxPos + 1 + i,
      slug: await generateUniqueSlug(user.id, link.url),
      title: link.title,
      url: link.url,
      userId: user.id,
      visible: link.visible,
    })),
  );

  await db.insert(linksTable).values(linkValues);

  // Auto-generate anch.to short URLs for each imported link so they match the
  // migration backfill's output shape (same userId, type='bio', per-row short_slug).
  for (const lv of linkValues) {
    await assignBioLinkShortSlug({ linkId: lv.id, userId: user.id });
  }

  // Apply profile data if opted in and fields are empty
  const profileUpdates: Record<string, string> = {};
  if (input.profile.applyDisplayName && input.profile.data.displayName != null && user.displayName == null) {
    profileUpdates.displayName = input.profile.data.displayName;
  }
  if (input.profile.applyBio && input.profile.data.bio != null && (user.bio == null || user.bio.length === 0)) {
    profileUpdates.bio = input.profile.data.bio;
  }
  if (input.profile.applyAvatar && input.profile.data.avatarUrl != null && user.avatarUrl == null) {
    profileUpdates.avatarUrl = input.profile.data.avatarUrl;
  }

  if (Object.keys(profileUpdates).length > 0) {
    await db
      .update(usersTable)
      .set({ ...profileUpdates, updatedAt: new Date() })
      .where(eq(usersTable.id, user.id));
  }

  // Compute total Pro days for celebration display
  let totalProDays = 0;
  if (proGranted) {
    totalProDays = IMPORT_PRO_DAYS;
    // Check if user also had referral Pro stacked
    const [updated] = await db
      .select({ proExpiresAt: usersTable.proExpiresAt })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (updated?.proExpiresAt != null) {
      totalProDays = Math.ceil((updated.proExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }
  }

  // Check if user was referred (for celebration copy)
  let referrerName: null | string = null;
  if (user.referredBy != null) {
    const [referrer] = await db
      .select({ displayName: usersTable.displayName, username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, user.referredBy))
      .limit(1);

    referrerName = referrer?.displayName ?? referrer?.username ?? null;
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return {
    importedCount: newLinks.length,
    proGranted,
    referrerName,
    success: true,
    totalProDays,
  };
}

// ─── Alert Dismissal ─────────────────────────────────────────────────────────

export async function dismissAlert(alertId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const prefs = (user.preferences ?? {}) as UserPreferences;
  const dismissed = prefs.dismissedAlerts ?? [];

  if (dismissed.includes(alertId)) {
    return { success: true };
  }

  const updated: UserPreferences = {
    ...prefs,
    dismissedAlerts: [...dismissed, alertId],
  };

  await db.update(usersTable).set({ preferences: updated, updatedAt: new Date() }).where(eq(usersTable.id, user.id));

  revalidatePath("/dashboard");

  return { success: true };
}
