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
      description: "Link-in-bio platform for the AI agent era",
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
      version: "1.0",
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
