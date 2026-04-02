import type { ApiKeyUser } from "@/lib/api/auth";
import { DARK_THEME_ID_LIST, LIGHT_THEME_ID_LIST, THEME_IDS } from "@/lib/themes";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getProfile, updateProfile, updateTheme } from "../services/profile";
import { toToolResult } from "../tool-result";

export function registerProfileTools(server: McpServer, user: ApiKeyUser): void {
  server.registerTool(
    "get_profile",
    {
      annotations: { readOnlyHint: true },
      description:
        "Get the authenticated user's Anchr profile, including display name, bio, avatar, theme settings, tier, link/group counts, total clicks, and profile URL.",
      title: "Get Profile",
    },
    async () => {
      const result = await getProfile(user);
      return toToolResult(result);
    },
  );

  server.registerTool(
    "update_profile",
    {
      annotations: { readOnlyHint: false },
      description:
        "Update the authenticated user's display name and/or bio. Provide only the fields you want to change.",
      inputSchema: {
        bio: z
          .string()
          .max(500)
          .optional()
          .describe("Short bio text (max 500 characters). Pass empty string to clear."),
        displayName: z
          .string()
          .max(100)
          .optional()
          .describe("Display name (max 100 characters). Pass empty string to clear."),
      },
      title: "Update Profile",
    },
    async ({ bio, displayName }) => {
      const result = await updateProfile(user, { bio, displayName });
      return toToolResult(result);
    },
  );

  server.registerTool(
    "update_theme",
    {
      annotations: { readOnlyHint: false },
      description: `Change the page theme for dark and/or light mode. Available theme IDs: ${THEME_IDS.join(", ")}. Dark themes: ${DARK_THEME_ID_LIST.join(", ")}. Light themes: ${LIGHT_THEME_ID_LIST.join(", ")}.`,
      inputSchema: {
        pageDarkTheme: z
          .string()
          .optional()
          .describe(`Dark mode theme ID. Options: ${DARK_THEME_ID_LIST.join(", ")}`),
        pageLightTheme: z
          .string()
          .optional()
          .describe(`Light mode theme ID. Options: ${LIGHT_THEME_ID_LIST.join(", ")}`),
      },
      title: "Update Theme",
    },
    async ({ pageDarkTheme, pageLightTheme }) => {
      const result = await updateTheme(user, { pageDarkTheme, pageLightTheme });
      return toToolResult(result);
    },
  );
}
