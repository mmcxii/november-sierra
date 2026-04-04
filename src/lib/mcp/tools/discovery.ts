import { lookupProfile } from "@/lib/services/discovery";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { toToolResult } from "../tool-result";

export function registerDiscoveryTools(server: McpServer): void {
  server.registerTool(
    "lookup_profile",
    {
      annotations: { readOnlyHint: true },
      description:
        "Look up any public Anchr profile by username. Returns display name, bio, avatar, visible links, and groups.",
      inputSchema: {
        username: z.string().min(1).describe("The Anchr username to look up."),
      },
      title: "Lookup Profile",
    },
    async ({ username }) => {
      const result = await lookupProfile(username);
      return toToolResult(result);
    },
  );
}
