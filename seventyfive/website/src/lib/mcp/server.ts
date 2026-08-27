import type { McpUser } from "@/lib/mcp/types";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBoardTools } from "./tools/board";
import { registerTaskTools } from "./tools/tasks";
import { registerTeamTools } from "./tools/teams";

export function createMcpServer(user: McpUser): McpServer {
  const server = new McpServer({
    name: "SeventyFive",
    version: "1.0.0",
  });

  registerTeamTools(server, user);
  registerBoardTools(server, user);
  registerTaskTools(server, user);

  return server;
}
