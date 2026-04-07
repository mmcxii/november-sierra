import { z } from "zod/v4";
import { THEME_VARIABLE_KEYS } from "../custom-themes";

/** Build a strict schema requiring all 21 theme variable keys with non-empty string values. */
const themeVariablesShape: Record<string, z.ZodString> = {};
for (const key of THEME_VARIABLE_KEYS) {
  themeVariablesShape[key] = z.string().min(1);
}
const themeVariablesSchema = z.object(themeVariablesShape).strict();

export const customThemeSchema = z.object({
  backgroundImage: z.string().url().nullable().optional(),
  borderRadius: z.number().int().min(0).max(50).nullable().optional(),
  font: z
    .string()
    .regex(/^[a-zA-Z0-9 -]*$/)
    .max(100)
    .nullable()
    .optional(),
  name: z.string().min(1).max(30),
  overlayColor: z.string().nullable().optional(),
  overlayOpacity: z.number().min(0).max(1).nullable().optional(),
  rawCss: z.string().max(10000).nullable().optional(),
  variables: themeVariablesSchema,
});

export type CustomThemeInput = z.infer<typeof customThemeSchema>;
