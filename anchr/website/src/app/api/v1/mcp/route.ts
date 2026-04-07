import { authenticateApiRequest } from "@/lib/api/auth";
import { API_ERROR_CODES } from "@/lib/api/errors";
import { CORS_HEADERS, apiError, apiOptions } from "@/lib/api/response";
import { createMcpServer } from "@/lib/mcp/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

async function handleMcpRequest(request: Request): Promise<Response> {
  const user = await authenticateApiRequest(request);

  if (user == null) {
    return apiError(API_ERROR_CODES.UNAUTHORIZED, "Invalid or missing API key.", 401);
  }

  if (user.tier !== "pro") {
    return apiError(API_ERROR_CODES.PRO_REQUIRED, "The hosted MCP server requires a Pro subscription.", 403);
  }

  const server = createMcpServer(user);

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  const response = await transport.handleRequest(request);

  return new Response(response.body, {
    headers: {
      ...CORS_HEADERS,
      ...Object.fromEntries(response.headers.entries()),
    },
    status: response.status,
  });
}

export const POST = handleMcpRequest;
export const GET = handleMcpRequest;
export const DELETE = handleMcpRequest;

export function OPTIONS() {
  return apiOptions();
}
