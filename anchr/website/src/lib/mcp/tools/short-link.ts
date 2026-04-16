import type { ApiKeyUser } from "@/lib/api/auth";
import { createShortLink, deleteShortLink, listShortLinks, updateShortLink } from "@/lib/services/short-link";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { toToolResult } from "../tool-result";

export function registerShortLinkTools(server: McpServer, user: ApiKeyUser): void {
  server.registerTool(
    "list_short_links",
    {
      annotations: { readOnlyHint: true },
      description:
        "List all transitory short links created by the authenticated user, including destination URL, slug, expiry, and password status.",
      title: "List Short Links",
    },
    async () => {
      const result = await listShortLinks(user);
      return toToolResult(result);
    },
  );

  const createDesc =
    user.tier === "pro"
      ? "Create a new short link. Provide a destination URL. Optionally set a custom slug (for use on custom shortener domain), expiry date, or password."
      : "Create a new short link. Provide a destination URL. Custom slugs, passwords, and UTM parameters require a Pro subscription.";

  server.registerTool(
    "create_short_link",
    {
      annotations: { readOnlyHint: false },
      description: createDesc,
      inputSchema: {
        customSlug: z
          .string()
          .max(100)
          .regex(/^[a-z0-9-]*$/)
          .optional()
          .describe(
            "Custom slug for use on a custom shortener domain (Pro feature). Only resolves on custom domains, not on the global short domain.",
          ),
        expiresAt: z
          .string()
          .datetime()
          .optional()
          .describe("ISO 8601 datetime when the short link expires. Omit for no expiry."),
        password: z.string().min(1).max(128).optional().describe("Password to protect the short link (Pro feature)."),
        url: z.string().min(1).describe("The destination URL. Protocol (https://) is added automatically if missing."),
      },
      title: "Create Short Link",
    },
    async ({ customSlug, expiresAt, password, url }) => {
      const result = await createShortLink(user, { customSlug, expiresAt, password, url });
      return toToolResult(result);
    },
  );

  server.registerTool(
    "update_short_link",
    {
      annotations: { readOnlyHint: false },
      description:
        "Update an existing short link's destination URL, custom slug, expiry, or password. Provide only the fields you want to change.",
      inputSchema: {
        customSlug: z
          .string()
          .max(100)
          .regex(/^[a-z0-9-]*$/)
          .nullable()
          .optional()
          .describe("New custom slug, or null to remove."),
        expiresAt: z.string().datetime().nullable().optional().describe("New expiry datetime, or null to remove."),
        id: z.string().describe("The short link ID to update."),
        password: z.string().min(1).max(128).nullable().optional().describe("New password, or null to remove."),
        url: z.string().min(1).optional().describe("New destination URL."),
      },
      title: "Update Short Link",
    },
    async ({ customSlug, expiresAt, id, password, url }) => {
      const result = await updateShortLink(user, id, { customSlug, expiresAt, password, url });
      return toToolResult(result);
    },
  );

  server.registerTool(
    "delete_short_link",
    {
      annotations: { destructiveHint: true, readOnlyHint: false },
      description: "Permanently delete a short link. The slug will be tombstoned and cannot be reused.",
      inputSchema: {
        id: z.string().describe("The short link ID to delete."),
      },
      title: "Delete Short Link",
    },
    async ({ id }) => {
      const result = await deleteShortLink(user, id);
      return toToolResult(result);
    },
  );
}
