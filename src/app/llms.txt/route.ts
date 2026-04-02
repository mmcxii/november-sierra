import { envSchema } from "@/lib/env";

export function GET() {
  const baseUrl = envSchema.NEXT_PUBLIC_APP_URL;

  const text = `# Anchr

> Anchr is a link-in-bio platform that brings your scattered profiles, payment handles, and important links into one beautiful, blazing-fast page you actually own.

Every user has a public profile at \`${baseUrl}/{username}\`. Each profile page includes rich JSON-LD structured data (schema.org \`ProfilePage\`, \`Person\` with \`sameAs\`, and \`ItemList\` of all links).

Profiles can also be accessed via custom domains (e.g., \`https://alice.com\`).

## Profiles

- [Sitemap](${baseUrl}/sitemap.xml): Discover all public Anchr profiles
- [Pricing](${baseUrl}/pricing): Free and Pro tier details

## API

Anchr provides a public REST API at \`${baseUrl}/api/v1\`. Authenticate with an API key via \`Authorization: Bearer anc_k_...\`.

- \`GET /api/v1/me\` — Authenticated user profile
- \`GET /api/v1/users/{username}\` — Public user profile with links and groups
- \`GET /api/v1/links\` — List, create, update, delete links
- \`GET /api/v1/groups\` — List, create, update, delete groups (Pro)
- \`GET /api/v1/analytics\` — Click analytics summary (Pro)
- \`GET /api/v1/openapi.json\` — Full OpenAPI specification

## MCP Server

Anchr exposes a hosted [Model Context Protocol](https://modelcontextprotocol.io) server for Pro users at \`${baseUrl}/api/v1/mcp\`.

- **Transport**: Streamable HTTP (stateless)
- **Auth**: API key via \`Authorization: Bearer anc_k_...\`
- **npm package**: \`@anthropic/anchr-mcp\` (coming soon)

### Tools

| Tool | Description |
|---|---|
| get_profile | Get your Anchr profile |
| update_profile | Update display name and bio |
| update_theme | Change page theme |
| list_links | List all links |
| create_link | Create a new link |
| update_link | Update an existing link |
| delete_link | Delete a link |
| reorder_links | Reorder links |
| toggle_link_visibility | Show or hide a link |
| toggle_featured_link | Feature or unfeature a link |
| list_groups | List link groups (Pro) |
| create_group | Create a link group (Pro) |
| update_group | Update a link group (Pro) |
| delete_group | Delete a link group (Pro) |
| get_analytics | Click analytics summary (Pro) |
| get_link_analytics | Per-link click analytics (Pro) |
| get_referrer_analytics | Referrer analytics (Pro) |
| get_device_analytics | Device analytics (Pro) |
| get_click_history | Click history over time (Pro) |
| lookup_profile | Look up any public Anchr profile |
`;

  return new Response(text, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
