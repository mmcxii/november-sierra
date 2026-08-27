import { authenticateApiRequest } from "@/lib/mcp/auth";
import { CORS_HEADERS, apiError, apiOptions } from "@/lib/mcp/cors";
import { createMcpServer } from "@/lib/mcp/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

async function handleMcpRequest(request: Request): Promise<Response> {
  const user = await authenticateApiRequest(request);
  if (user == null) {
    return apiError("UNAUTHORIZED", "Invalid or missing API key.", 401);
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
