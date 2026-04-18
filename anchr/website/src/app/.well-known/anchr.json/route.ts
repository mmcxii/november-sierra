import { envSchema } from "@/lib/env";

export function GET() {
  const baseUrl = envSchema.NEXT_PUBLIC_APP_URL;

  return Response.json(
    {
      api: {
        authentication: "Bearer token via API key (Authorization: Bearer anc_k_...)",
        baseUrl: `${baseUrl}/api/v1`,
        docs: `${baseUrl}/docs`,
        openApiSpec: `${baseUrl}/api/v1/openapi.json`,
      },
      compatibleClients: [
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
      ],
      description: "Link-in-bio and URL shortener for the AI agent era",
      mcp: {
        hosted: `${baseUrl}/api/v1/mcp`,
        npm: "@anthropic/anchr-mcp",
        transport: "streamable-http",
      },
      name: "Anchr",
      profiles: {
        sitemap: `${baseUrl}/sitemap.xml`,
        structuredData: "JSON-LD (schema.org ProfilePage, Person, ItemList)",
        urlPattern: `${baseUrl}/{username}`,
      },
      shortLinks: {
        domain: "anch.to",
        urlPattern: "https://anch.to/{slug}",
      },
      version: "1.0",
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
