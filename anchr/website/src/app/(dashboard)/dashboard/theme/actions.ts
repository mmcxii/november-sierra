"use server";

import { auth } from "@/lib/auth";
import { sanitizeCss } from "@/lib/css-sanitizer";
import { PRO_THEME_LIMIT } from "@/lib/custom-themes";
import { db } from "@/lib/db/client";
import { countCustomThemesByUserId, getCustomThemeById, getCustomThemesByUserId } from "@/lib/db/queries/custom-theme";
import { customThemesTable } from "@/lib/db/schema/custom-theme";
import { usersTable } from "@/lib/db/schema/user";
import type { CustomThemeInput } from "@/lib/schemas/custom-theme";
import { isValidThemeId } from "@/lib/themes";
import { isProUser } from "@/lib/tier";
import { autoVersionThemeName } from "@/lib/utils/custom-theme";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResult =
  | { error: string; sanitizationErrors?: string[]; success: false }
  | { sanitizationErrors?: string[]; success: true };

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (userId == null) {
    return null;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  return user ?? null;
}

function revalidateUserPages(username: string) {
  revalidatePath("/dashboard/theme");
  revalidatePath(`/${username}`);
}

// ─── Custom Theme CRUD ──────────────────────────────────────────────────────

export async function createCustomTheme(data: CustomThemeInput): Promise<ActionResult & { themeId?: string }> {
  const user = await getAuthenticatedUser();
  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (!isProUser(user)) {
    return { error: "upgradeToProToManageCustomThemes", success: false };
  }

  const currentCount = await countCustomThemesByUserId(user.id);

  if (currentCount >= PRO_THEME_LIMIT) {
    return { error: "themeLimitReached", success: false };
  }

  // Auto-version name if duplicate
  const existingThemes = await getCustomThemesByUserId(user.id);
  const existingNames = existingThemes.map((t) => t.name);
  const name = autoVersionThemeName(data.name, existingNames);

  // Sanitize raw CSS if present
  let rawCss: null | string = null;
  let sanitizationErrors: string[] = [];
  if (data.rawCss != null && data.rawCss.trim() !== "") {
    const result = sanitizeCss(data.rawCss);
    rawCss = result.sanitized || null;
    sanitizationErrors = result.errors;

    if (result.errors.length > 0) {
      console.warn(`[ANC-136] CSS sanitization stripped content for user ${user.id}:`, result.errors);
    }
  }

  let themeId: string;
  try {
    const [theme] = await db
      .insert(customThemesTable)
      .values({
        backgroundImage: data.backgroundImage ?? null,
        borderRadius: data.borderRadius ?? null,
        font: data.font ?? null,
        name,
        overlayColor: data.overlayColor ?? null,
        overlayOpacity: data.overlayOpacity ?? null,
        rawCss,
        userId: user.id,
        variables: data.variables,
      })
      .returning({ id: customThemesTable.id });

    if (theme == null) {
      return { error: "somethingWentWrongPleaseTryAgain", success: false };
    }
    themeId = theme.id;
  } catch {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  revalidateUserPages(user.username);
  return { sanitizationErrors: sanitizationErrors.length > 0 ? sanitizationErrors : undefined, success: true, themeId };
}

export async function updateCustomTheme(themeId: string, data: CustomThemeInput): Promise<ActionResult> {
  const user = await getAuthenticatedUser();
  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (!isProUser(user)) {
    return { error: "upgradeToProToManageCustomThemes", success: false };
  }

  const existing = await getCustomThemeById(themeId, user.id);
  if (existing == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  // Sanitize raw CSS if present
  let rawCss: null | string = existing.rawCss;
  let sanitizationErrors: string[] = [];
  if (data.rawCss != null) {
    const result = sanitizeCss(data.rawCss);
    rawCss = result.sanitized || null;
    sanitizationErrors = result.errors;

    if (result.errors.length > 0) {
      console.warn(`[ANC-136] CSS sanitization stripped content for user ${user.id}:`, result.errors);
    }
  }

  await db
    .update(customThemesTable)
    .set({
      backgroundImage: data.backgroundImage ?? null,
      borderRadius: data.borderRadius ?? null,
      font: data.font ?? null,
      name: data.name,
      overlayColor: data.overlayColor ?? null,
      overlayOpacity: data.overlayOpacity ?? null,
      rawCss,
      updatedAt: new Date(),
      variables: data.variables,
    })
    .where(eq(customThemesTable.id, themeId));

  revalidateUserPages(user.username);
  return { sanitizationErrors: sanitizationErrors.length > 0 ? sanitizationErrors : undefined, success: true };
}

export async function deleteCustomTheme(themeId: string): Promise<ActionResult> {
  const user = await getAuthenticatedUser();
  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  // Intentionally not Pro-gated: free users (downgraded) can still clean up their legacy themes.

  const existing = await getCustomThemeById(themeId, user.id);
  if (existing == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  // If this theme is assigned to a slot, reset to default preset
  const updates: Partial<Record<string, Date | string>> = {};
  if (user.pageDarkTheme === themeId) {
    updates.pageDarkTheme = "dark-depths";
  }
  if (user.pageLightTheme === themeId) {
    updates.pageLightTheme = "stateroom";
  }
  if (Object.keys(updates).length > 0) {
    updates.updatedAt = new Date();
    await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id));
  }

  await db.delete(customThemesTable).where(eq(customThemesTable.id, themeId));

  revalidateUserPages(user.username);
  return { success: true };
}

// ─── Theme Slot Assignment ──────────────────────────────────────────────────

export async function assignThemeToSlot(
  slot: "pageDarkTheme" | "pageLightTheme",
  themeId: string,
): Promise<ActionResult> {
  const user = await getAuthenticatedUser();
  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  if (!isProUser(user)) {
    return { error: "upgradeToProToManageCustomThemes", success: false };
  }

  // Validate: either a preset ID or a custom theme owned by this user
  if (!isValidThemeId(themeId)) {
    const customTheme = await getCustomThemeById(themeId, user.id);
    if (customTheme == null) {
      return { error: "somethingWentWrongPleaseTryAgain", success: false };
    }
  }

  await db
    .update(usersTable)
    .set({ [slot]: themeId, updatedAt: new Date() })
    .where(eq(usersTable.id, user.id));

  revalidateUserPages(user.username);
  return { success: true };
}

// ─── Light/Dark Toggles ─────────────────────────────────────────────────────

export async function updateThemeToggles(lightEnabled: boolean, darkEnabled: boolean): Promise<ActionResult> {
  if (!lightEnabled && !darkEnabled) {
    return { error: "atLeastOneThemeMustBeEnabled", success: false };
  }

  const user = await getAuthenticatedUser();
  if (user == null) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  // Intentionally not Pro-gated: enabling/disabling the light or dark slot
  // applies to preset themes too, so free users can still choose a light-only
  // or dark-only bio page.

  await db
    .update(usersTable)
    .set({ pageDarkEnabled: darkEnabled, pageLightEnabled: lightEnabled, updatedAt: new Date() })
    .where(eq(usersTable.id, user.id));

  revalidateUserPages(user.username);
  return { success: true };
}
