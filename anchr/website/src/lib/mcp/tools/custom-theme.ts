import type { ApiKeyUser } from "@/lib/api/auth";
import { THEME_NAME_MAX_LENGTH, THEME_VARIABLE_KEYS } from "@/lib/custom-themes";
import {
  createCustomTheme,
  deleteCustomTheme,
  getTheme,
  listThemes,
  updateCustomTheme,
} from "@/lib/services/custom-theme";
import { updateTheme } from "@/lib/services/profile";
import { DARK_THEME_ID_LIST, LIGHT_THEME_ID_LIST } from "@/lib/themes";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { toToolResult } from "../tool-result";

const FONT_REGEX = /^[a-zA-Z0-9 -]*$/;
const PRESET_IDS_NOTE = `Preset IDs: ${[...DARK_THEME_ID_LIST, ...LIGHT_THEME_ID_LIST].join(", ")}. Custom theme UUIDs from list_themes also accepted.`;

function buildFullVariablesSchema() {
  const shape: Record<string, z.ZodString> = {};
  for (const key of THEME_VARIABLE_KEYS) {
    shape[key] = z.string().min(1);
  }
  return z.object(shape);
}

function buildPartialVariablesSchema() {
  const shape: Record<string, z.ZodOptional<z.ZodString>> = {};
  for (const key of THEME_VARIABLE_KEYS) {
    shape[key] = z.string().min(1).optional();
  }
  return z.object(shape);
}

const fullVariablesSchema = buildFullVariablesSchema();
const partialVariablesSchema = buildPartialVariablesSchema();

export function registerCustomThemeTools(server: McpServer, user: ApiKeyUser): void {
  const proNote = user.tier === "pro" ? "" : " Requires a Pro subscription.";

  server.registerTool(
    "list_themes",
    {
      annotations: { readOnlyHint: true },
      description:
        "List every theme available to the user: built-in presets and the user's custom themes. Response is split into `presets` and `custom` arrays.",
      title: "List Themes",
    },
    async () => {
      const result = await listThemes(user);
      return toToolResult(result);
    },
  );

  server.registerTool(
    "get_theme",
    {
      annotations: { readOnlyHint: true },
      description:
        "Get full details for a theme by ID. Accepts either a preset ID or a custom theme UUID. Response includes a `type` discriminator of `preset` or `custom`.",
      inputSchema: {
        id: z.string().describe("Preset theme ID or custom theme UUID."),
      },
      title: "Get Theme",
    },
    async ({ id }) => {
      const result = await getTheme(user, id);
      return toToolResult(result);
    },
  );

  server.registerTool(
    "create_custom_theme",
    {
      annotations: { readOnlyHint: false },
      description: `Create a custom theme with the 21 CSS variables, plus optional raw CSS, font, border radius, background image, and overlay.${proNote}`,
      inputSchema: {
        backgroundImage: z.string().url().nullable().optional().describe("Background image URL."),
        borderRadius: z.number().int().min(0).max(50).nullable().optional().describe("Border radius 0-50 px."),
        font: z
          .string()
          .regex(FONT_REGEX)
          .max(100)
          .nullable()
          .optional()
          .describe("Google Font family name (alphanumeric/space/hyphen)."),
        name: z.string().min(1).max(THEME_NAME_MAX_LENGTH).describe("Theme name. Must be unique per user."),
        overlayColor: z.string().nullable().optional().describe("CSS color for the overlay."),
        overlayOpacity: z.number().min(0).max(1).nullable().optional().describe("Overlay opacity 0-1."),
        rawCss: z.string().max(10_000).nullable().optional().describe("Raw CSS appended to the page."),
        variables: fullVariablesSchema.describe("All 21 CSS variables. Every key is required."),
      },
      title: "Create Custom Theme",
    },
    async (input) => {
      const result = await createCustomTheme(user, input);
      return toToolResult(result);
    },
  );

  server.registerTool(
    "update_custom_theme",
    {
      annotations: { readOnlyHint: false },
      description: `Update fields on a custom theme. All fields are optional; variables accepts a partial subset of the 21 keys and merges with the existing set. rawCss is full-replace.${proNote}`,
      inputSchema: {
        backgroundImage: z.string().url().nullable().optional(),
        borderRadius: z.number().int().min(0).max(50).nullable().optional(),
        font: z.string().regex(FONT_REGEX).max(100).nullable().optional(),
        id: z.string().describe("Custom theme UUID."),
        name: z.string().min(1).max(THEME_NAME_MAX_LENGTH).optional(),
        overlayColor: z.string().nullable().optional(),
        overlayOpacity: z.number().min(0).max(1).nullable().optional(),
        rawCss: z.string().max(10_000).nullable().optional(),
        variables: partialVariablesSchema.optional().describe("Partial variable overrides; merges with existing."),
      },
      title: "Update Custom Theme",
    },
    async ({ id, ...rest }) => {
      const result = await updateCustomTheme(user, id, rest);
      return toToolResult(result);
    },
  );

  server.registerTool(
    "delete_custom_theme",
    {
      annotations: { destructiveHint: true, readOnlyHint: false },
      description:
        "Permanently delete a custom theme. If either bio-page slot points at this theme, the slot is reset to the preset default (dark-depths / stateroom).",
      inputSchema: {
        id: z.string().describe("Custom theme UUID."),
      },
      title: "Delete Custom Theme",
    },
    async ({ id }) => {
      const result = await deleteCustomTheme(user, id);
      return toToolResult(result);
    },
  );

  server.registerTool(
    "assign_theme",
    {
      annotations: { readOnlyHint: false },
      description: `Assign a theme to one bio-page slot. Pass null to disable the slot. At least one slot must stay enabled. ${PRESET_IDS_NOTE}`,
      inputSchema: {
        slot: z.enum(["dark", "light"]).describe("Which bio-page slot to assign."),
        themeId: z.string().nullable().describe("Preset ID, custom theme UUID, or null to disable the slot."),
      },
      title: "Assign Theme",
    },
    async ({ slot, themeId }) => {
      const input = slot === "dark" ? { pageDarkTheme: themeId } : { pageLightTheme: themeId };
      const result = await updateTheme(user, input);
      return toToolResult(result);
    },
  );
}
