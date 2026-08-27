import { SITE_URL } from "@/lib/constants";

const LlmsTxtRoute = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL;
  const body = `# SeventyFive

SeventyFive is a 75-day accountability tracker for private teams.

## MCP

Hosted Model Context Protocol server for checking tasks and reading personal and team progress:

- URL: ${baseUrl}/api/v1/mcp
- Auth: \`Authorization: Bearer sf_k_...\` (create a key in Account settings)
- Tools: \`list_teams\`, \`get_board\`, \`set_task\`

Create an API key at ${baseUrl}/settings, then add the server to Cursor or Claude with that Bearer token.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

export const GET = LlmsTxtRoute;
