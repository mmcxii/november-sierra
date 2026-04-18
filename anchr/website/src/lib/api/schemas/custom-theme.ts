import { z } from "zod";
import { THEME_NAME_MAX_LENGTH, THEME_VARIABLE_KEYS } from "../../custom-themes";

const themeVariablesShape: Record<string, z.ZodString> = {};
for (const key of THEME_VARIABLE_KEYS) {
  themeVariablesShape[key] = z.string().min(1);
}

const themeVariablesFullSchema = z.object(themeVariablesShape).strict();

const themeVariablesPartialShape: Record<string, z.ZodOptional<z.ZodString>> = {};
for (const key of THEME_VARIABLE_KEYS) {
  themeVariablesPartialShape[key] = z.string().min(1).optional();
}

const themeVariablesPartialSchema = z.object(themeVariablesPartialShape).strict();

const FONT_REGEX = /^[a-zA-Z0-9 -]*$/;
const MAX_RAW_CSS = 10_000;

export const createCustomThemeSchema = z
  .object({
    backgroundImage: z.string().url().nullable().optional(),
    borderRadius: z.number().int().min(0).max(50).nullable().optional(),
    font: z.string().regex(FONT_REGEX).max(100).nullable().optional(),
    name: z.string().min(1).max(THEME_NAME_MAX_LENGTH),
    overlayColor: z.string().nullable().optional(),
    overlayOpacity: z.number().min(0).max(1).nullable().optional(),
    rawCss: z.string().max(MAX_RAW_CSS).nullable().optional(),
    variables: themeVariablesFullSchema,
  })
  .strict();

export const updateCustomThemeSchema = z
  .object({
    backgroundImage: z.string().url().nullable().optional(),
    borderRadius: z.number().int().min(0).max(50).nullable().optional(),
    font: z.string().regex(FONT_REGEX).max(100).nullable().optional(),
    name: z.string().min(1).max(THEME_NAME_MAX_LENGTH).optional(),
    overlayColor: z.string().nullable().optional(),
    overlayOpacity: z.number().min(0).max(1).nullable().optional(),
    rawCss: z.string().max(MAX_RAW_CSS).nullable().optional(),
    variables: themeVariablesPartialSchema.optional(),
  })
  .strict();

export type CreateCustomThemeInput = z.infer<typeof createCustomThemeSchema>;
export type UpdateCustomThemeInput = z.infer<typeof updateCustomThemeSchema>;
