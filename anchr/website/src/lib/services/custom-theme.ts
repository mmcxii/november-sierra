import type { ApiKeyUser } from "@/lib/api/auth";
import { API_ERROR_CODES } from "@/lib/api/errors";
import type { CreateCustomThemeInput, UpdateCustomThemeInput } from "@/lib/api/schemas/custom-theme";
import { sanitizeCss } from "@/lib/css-sanitizer";
import { PRO_THEME_LIMIT, type ThemeVariables } from "@/lib/custom-themes";
import { db } from "@/lib/db/client";
import { getCustomThemeById, getCustomThemesByUserId } from "@/lib/db/queries/custom-theme";
import { customThemesTable } from "@/lib/db/schema/custom-theme";
import { usersTable } from "@/lib/db/schema/user";
import { DARK_THEME_ID_LIST, isValidThemeId, LIGHT_THEME_ID_LIST, THEMES, type ThemeId } from "@/lib/themes";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePro } from "./require-pro";
import { serviceError, serviceSuccess, type ServiceResult } from "./types";

// ─── Response shapes ────────────────────────────────────────────────────────

export type PresetThemeResponse = {
  id: ThemeId;
  mode: "dark" | "light";
  name: string;
  swatch: { accent: string; bg: string; card: string };
  type: "preset";
};

export type CustomThemeResponse = {
  backgroundImage: null | string;
  borderRadius: null | number;
  createdAt: string;
  font: null | string;
  id: string;
  name: string;
  overlayColor: null | string;
  overlayOpacity: null | number;
  rawCss: null | string;
  type: "custom";
  updatedAt: string;
  variables: ThemeVariables;
};

export type ListThemesResponse = {
  custom: CustomThemeResponse[];
  presets: PresetThemeResponse[];
};

export type CustomThemeMutationResponse = CustomThemeResponse & {
  warnings?: string[];
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function toCustomThemeResponse(row: typeof customThemesTable.$inferSelect): CustomThemeResponse {
  return {
    backgroundImage: row.backgroundImage,
    borderRadius: row.borderRadius,
    createdAt: row.createdAt.toISOString(),
    font: row.font,
    id: row.id,
    name: row.name,
    overlayColor: row.overlayColor,
    overlayOpacity: row.overlayOpacity,
    rawCss: row.rawCss,
    type: "custom",
    updatedAt: row.updatedAt.toISOString(),
    variables: row.variables as ThemeVariables,
  };
}

function buildPresetList(): PresetThemeResponse[] {
  const entries: PresetThemeResponse[] = [];
  for (const id of DARK_THEME_ID_LIST) {
    entries.push({ id, mode: "dark", name: THEMES[id].name, swatch: THEMES[id].swatch, type: "preset" });
  }
  for (const id of LIGHT_THEME_ID_LIST) {
    entries.push({ id, mode: "light", name: THEMES[id].name, swatch: THEMES[id].swatch, type: "preset" });
  }
  return entries;
}

function revalidate(username: string): void {
  revalidatePath("/dashboard");
  revalidatePath(`/${username}`);
}

// ─── Read ───────────────────────────────────────────────────────────────────

export async function listThemes(user: ApiKeyUser): Promise<ServiceResult<ListThemesResponse>> {
  const rows = await getCustomThemesByUserId(user.id);
  return serviceSuccess({
    custom: rows.map(toCustomThemeResponse),
    presets: buildPresetList(),
  });
}

export async function getTheme(
  user: ApiKeyUser,
  id: string,
): Promise<ServiceResult<CustomThemeResponse | PresetThemeResponse>> {
  if (isValidThemeId(id)) {
    const preset: PresetThemeResponse = {
      id,
      mode: DARK_THEME_ID_LIST.includes(id) ? "dark" : "light",
      name: THEMES[id].name,
      swatch: THEMES[id].swatch,
      type: "preset",
    };
    return serviceSuccess(preset);
  }

  const row = await getCustomThemeById(id, user.id);
  if (row == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Theme not found.", 404);
  }
  return serviceSuccess(toCustomThemeResponse(row));
}

// ─── Create ─────────────────────────────────────────────────────────────────

export async function createCustomTheme(
  user: ApiKeyUser,
  input: CreateCustomThemeInput,
): Promise<ServiceResult<CustomThemeMutationResponse>> {
  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const existing = await getCustomThemesByUserId(user.id);

  if (existing.length >= PRO_THEME_LIMIT) {
    return serviceError(API_ERROR_CODES.VALIDATION_ERROR, `Theme limit reached (${PRO_THEME_LIMIT}).`, 400);
  }

  if (existing.some((t) => t.name === input.name)) {
    return serviceError(API_ERROR_CODES.VALIDATION_ERROR, `A theme named "${input.name}" already exists.`, 409);
  }

  const { rawCss, warnings } = sanitizeRawCss(input.rawCss);

  const [created] = await db
    .insert(customThemesTable)
    .values({
      backgroundImage: input.backgroundImage ?? null,
      borderRadius: input.borderRadius ?? null,
      font: input.font ?? null,
      name: input.name,
      overlayColor: input.overlayColor ?? null,
      overlayOpacity: input.overlayOpacity ?? null,
      rawCss,
      userId: user.id,
      variables: input.variables,
    })
    .returning();

  if (created == null) {
    return serviceError(API_ERROR_CODES.INTERNAL_ERROR, "Failed to create theme.", 500);
  }

  revalidate(user.username);

  return serviceSuccess({
    ...toCustomThemeResponse(created),
    ...(warnings.length > 0 && { warnings }),
  });
}

// ─── Update ─────────────────────────────────────────────────────────────────

export async function updateCustomTheme(
  user: ApiKeyUser,
  id: string,
  input: UpdateCustomThemeInput,
): Promise<ServiceResult<CustomThemeMutationResponse>> {
  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const current = await getCustomThemeById(id, user.id);
  if (current == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Theme not found.", 404);
  }

  if (input.name != null && input.name !== current.name) {
    const others = await getCustomThemesByUserId(user.id);
    if (others.some((t) => t.id !== id && t.name === input.name)) {
      return serviceError(API_ERROR_CODES.VALIDATION_ERROR, `A theme named "${input.name}" already exists.`, 409);
    }
  }

  const mergedVariables: ThemeVariables = {
    ...(current.variables as ThemeVariables),
    ...(input.variables ?? {}),
  };

  const { rawCss: sanitizedRawCss, warnings } =
    input.rawCss !== undefined ? sanitizeRawCss(input.rawCss) : { rawCss: current.rawCss, warnings: [] };

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    variables: mergedVariables,
  };

  if (input.backgroundImage !== undefined) {
    updates.backgroundImage = input.backgroundImage;
  }
  if (input.borderRadius !== undefined) {
    updates.borderRadius = input.borderRadius;
  }
  if (input.font !== undefined) {
    updates.font = input.font;
  }
  if (input.name !== undefined) {
    updates.name = input.name;
  }
  if (input.overlayColor !== undefined) {
    updates.overlayColor = input.overlayColor;
  }
  if (input.overlayOpacity !== undefined) {
    updates.overlayOpacity = input.overlayOpacity;
  }
  if (input.rawCss !== undefined) {
    updates.rawCss = sanitizedRawCss;
  }

  const [updated] = await db
    .update(customThemesTable)
    .set(updates)
    .where(and(eq(customThemesTable.id, id), eq(customThemesTable.userId, user.id)))
    .returning();

  if (updated == null) {
    return serviceError(API_ERROR_CODES.INTERNAL_ERROR, "Failed to update theme.", 500);
  }

  revalidate(user.username);

  return serviceSuccess({
    ...toCustomThemeResponse(updated),
    ...(warnings.length > 0 && { warnings }),
  });
}

// ─── Delete ─────────────────────────────────────────────────────────────────

export async function deleteCustomTheme(user: ApiKeyUser, id: string): Promise<ServiceResult<null>> {
  // Not Pro-gated: downgraded users must still be able to clean up legacy themes.
  const current = await getCustomThemeById(id, user.id);
  if (current == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "Theme not found.", 404);
  }

  const [dbUser] = await db
    .select({ pageDarkTheme: usersTable.pageDarkTheme, pageLightTheme: usersTable.pageLightTheme })
    .from(usersTable)
    .where(eq(usersTable.id, user.id))
    .limit(1);

  const slotUpdates: Record<string, Date | string> = {};
  if (dbUser?.pageDarkTheme === id) {
    slotUpdates.pageDarkTheme = "dark-depths";
  }
  if (dbUser?.pageLightTheme === id) {
    slotUpdates.pageLightTheme = "stateroom";
  }
  if (Object.keys(slotUpdates).length > 0) {
    slotUpdates.updatedAt = new Date();
    await db.update(usersTable).set(slotUpdates).where(eq(usersTable.id, user.id));
  }

  await db.delete(customThemesTable).where(and(eq(customThemesTable.id, id), eq(customThemesTable.userId, user.id)));

  revalidate(user.username);

  return serviceSuccess(null);
}

// ─── Internal ────────────────────────────────────────────────────────────────

function sanitizeRawCss(raw: undefined | null | string): { rawCss: null | string; warnings: string[] } {
  if (raw == null || raw.trim() === "") {
    return { rawCss: null, warnings: [] };
  }
  const result = sanitizeCss(raw);
  return {
    rawCss: result.sanitized.length > 0 ? result.sanitized : null,
    warnings: result.errors,
  };
}
