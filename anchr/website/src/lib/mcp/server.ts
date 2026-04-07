import type { ApiKeyUser } from "@/lib/api/auth";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAnalyticsTools } from "./tools/analytics";
import { registerDiscoveryTools } from "./tools/discovery";
import { registerGroupTools } from "./tools/group";
import { registerLinkTools } from "./tools/link";
import { registerProfileTools } from "./tools/profile";

export function createMcpServer(user: ApiKeyUser): McpServer {
  const server = new McpServer({
    name: "Anchr",
    version: "1.0.0",
  });

  registerProfileTools(server, user);
  registerLinkTools(server, user);
  registerGroupTools(server, user);
  registerAnalyticsTools(server, user);
  registerDiscoveryTools(server);

  return server;
}
