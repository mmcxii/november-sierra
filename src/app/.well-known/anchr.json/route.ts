import { envSchema } from "@/lib/env";

export function GET() {
  const baseUrl = envSchema.NEXT_PUBLIC_APP_URL;

  return Response.json(
    {
      description: "Link-in-bio platform for the AI agent era",
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
