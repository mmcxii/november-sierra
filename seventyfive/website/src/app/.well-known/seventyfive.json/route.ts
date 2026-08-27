import { apiOptions } from "@/lib/api/response";
import { SITE_URL } from "@/lib/constants";

const COMPATIBLE_CLIENTS = [
  "OpenClaw",
  "ChatGPT Desktop",
  "Claude Desktop",
  "Claude Code",
  "Claude Agent SDK",
  "Google Gemini",
  "OpenAI Agents SDK",
  "Cursor",
  "Windsurf",
  "Zed",
  "Goose",
  "Cline",
  "Copilot Studio",
];

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL;

  return Response.json(
    {
      api: {
        authentication: "Bearer token via API key (Authorization: Bearer sf_k_...)",
        baseUrl: `${baseUrl}/api/v1`,
        openApiSpec: `${baseUrl}/api/v1/openapi.json`,
      },
      compatibleClients: COMPATIBLE_CLIENTS,
      description: "75-day Hard/Soft accountability tracker for private teams",
      mcp: {
        hosted: `${baseUrl}/api/v1/mcp`,
        transport: "streamable-http",
      },
      name: "SeventyFive",
      version: "1.0",
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}

export function OPTIONS() {
  return apiOptions();
}
