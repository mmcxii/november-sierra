import type { ApiKeyUser } from "@/lib/api/auth";
import { createGroup, deleteGroup, listGroups, updateGroup } from "@/lib/services/group";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { toToolResult } from "../tool-result";

export function registerGroupTools(server: McpServer, user: ApiKeyUser): void {
  const proNote = user.tier === "pro" ? "" : " Requires a Pro subscription.";

  server.registerTool(
    "list_groups",
    {
      annotations: { readOnlyHint: true },
      description: `List all link groups on the user's Anchr page.${proNote}`,
      title: "List Groups",
    },
    async () => {
      const result = await listGroups(user);
      return toToolResult(result);
    },
  );

  server.registerTool(
    "create_group",
    {
      annotations: { readOnlyHint: false },
      description: `Create a new link group to organize links.${proNote}`,
      inputSchema: {
        slug: z
          .string()
          .max(100)
          .regex(/^[a-z0-9-]*$/)
          .optional()
          .describe("Custom URL path for the group (lowercase alphanumeric and hyphens). Auto-generated if omitted."),
        title: z.string().min(1).max(100).describe("Group title."),
      },
      title: "Create Group",
    },
    async ({ slug, title }) => {
      const result = await createGroup(user, { slug, title });
      return toToolResult(result);
    },
  );

  server.registerTool(
    "update_group",
    {
      annotations: { readOnlyHint: false },
      description: `Update a group's title or slug. The Quick Links group cannot be modified.${proNote}`,
      inputSchema: {
        id: z.string().describe("The group ID to update."),
        slug: z
          .string()
          .max(100)
          .regex(/^[a-z0-9-]*$/)
          .optional()
          .describe("New custom URL path."),
        title: z.string().min(1).max(100).optional().describe("New group title."),
      },
      title: "Update Group",
    },
    async ({ id, slug, title }) => {
      const result = await updateGroup(user, id, { slug, title });
      return toToolResult(result);
    },
  );

  server.registerTool(
    "delete_group",
    {
      annotations: { destructiveHint: true, readOnlyHint: false },
      description: `Permanently delete a group. Links in the group are ungrouped, not deleted. The Quick Links group cannot be deleted.${proNote}`,
      inputSchema: {
        id: z.string().describe("The group ID to delete."),
      },
      title: "Delete Group",
    },
    async ({ id }) => {
      const result = await deleteGroup(user, id);
      return toToolResult(result);
    },
  );
}
