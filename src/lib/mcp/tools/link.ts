import type { ApiKeyUser } from "@/lib/api/auth";
import { FREE_LINK_LIMIT } from "@/lib/tier";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createLink,
  deleteLink,
  listLinks,
  reorderLinks,
  toggleFeaturedLink,
  toggleLinkVisibility,
  updateLink,
} from "../services/link";
import { toToolResult } from "../tool-result";

export function registerLinkTools(server: McpServer, user: ApiKeyUser): void {
  server.registerTool(
    "list_links",
    {
      annotations: { readOnlyHint: true },
      description:
        "List all links on the authenticated user's Anchr page, including title, URL, slug, group, visibility, featured status, and position.",
      title: "List Links",
    },
    async () => {
      const result = await listLinks(user);
      return toToolResult(result);
    },
  );

  const createDesc =
    user.tier === "pro"
      ? "Create a new link on the user's Anchr page. Provide a title and URL. Optionally set a custom slug (URL path) and assign to a group."
      : `Create a new link on the user's Anchr page. Provide a title and URL. Optionally set a custom slug (URL path). Free tier is limited to ${FREE_LINK_LIMIT} links.`;

  server.registerTool(
    "create_link",
    {
      annotations: { readOnlyHint: false },
      description: createDesc,
      inputSchema: {
        groupId: z.string().optional().describe("ID of the group to assign this link to (Pro feature)."),
        slug: z
          .string()
          .max(100)
          .regex(/^[a-z0-9-]*$/)
          .optional()
          .describe("Custom URL path (lowercase alphanumeric and hyphens). Auto-generated if omitted."),
        title: z.string().min(1).max(100).describe("Link title displayed on the page."),
        url: z.string().min(1).describe("The destination URL. Protocol (https://) is added automatically if missing."),
      },
      title: "Create Link",
    },
    async ({ groupId, slug, title, url }) => {
      const result = await createLink(user, { groupId, slug, title, url });
      return toToolResult(result);
    },
  );

  server.registerTool(
    "update_link",
    {
      annotations: { readOnlyHint: false },
      description:
        "Update an existing link's title, URL, slug, or group assignment. Provide only the fields you want to change.",
      inputSchema: {
        groupId: z.string().nullable().optional().describe("Group ID to assign, or null to ungroup."),
        id: z.string().describe("The link ID to update."),
        slug: z
          .string()
          .max(100)
          .regex(/^[a-z0-9-]*$/)
          .optional()
          .describe("New custom URL path."),
        title: z.string().min(1).max(100).optional().describe("New link title."),
        url: z.string().min(1).optional().describe("New destination URL."),
      },
      title: "Update Link",
    },
    async ({ groupId, id, slug, title, url }) => {
      const result = await updateLink(user, id, { groupId, slug, title, url });
      return toToolResult(result);
    },
  );

  server.registerTool(
    "delete_link",
    {
      annotations: { destructiveHint: true, readOnlyHint: false },
      description: "Permanently delete a link from the user's Anchr page.",
      inputSchema: {
        id: z.string().describe("The link ID to delete."),
      },
      title: "Delete Link",
    },
    async ({ id }) => {
      const result = await deleteLink(user, id);
      return toToolResult(result);
    },
  );

  server.registerTool(
    "reorder_links",
    {
      annotations: { readOnlyHint: false },
      description: "Reorder links by providing an array of { id, position } pairs. Position is a zero-based integer.",
      inputSchema: {
        items: z
          .array(
            z.object({
              id: z.string().describe("Link ID."),
              position: z.number().int().min(0).describe("New zero-based position."),
            }),
          )
          .min(1)
          .describe("Array of link ID and position pairs."),
      },
      title: "Reorder Links",
    },
    async ({ items }) => {
      const result = await reorderLinks(user, items);
      return toToolResult(result);
    },
  );

  server.registerTool(
    "toggle_link_visibility",
    {
      annotations: { readOnlyHint: false },
      description: "Toggle a link's visibility on the public profile. Hidden links are not shown to visitors.",
      inputSchema: {
        id: z.string().describe("The link ID to toggle."),
      },
      title: "Toggle Link Visibility",
    },
    async ({ id }) => {
      const result = await toggleLinkVisibility(user, id);
      return toToolResult(result);
    },
  );

  const featuredDesc =
    user.tier === "pro"
      ? "Feature or unfeature a link. Only one link can be featured at a time — featuring a new link automatically unfeatures the previous one."
      : "Feature or unfeature a link. Requires a Pro subscription.";

  server.registerTool(
    "toggle_featured_link",
    {
      annotations: { readOnlyHint: false },
      description: featuredDesc,
      inputSchema: {
        id: z.string().describe("The link ID to feature or unfeature."),
      },
      title: "Toggle Featured Link",
    },
    async ({ id }) => {
      const result = await toggleFeaturedLink(user, id);
      return toToolResult(result);
    },
  );
}
