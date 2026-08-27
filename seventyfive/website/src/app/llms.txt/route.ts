import { SITE_URL } from "@/lib/constants";

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL;

  const text = `# SeventyFive

> SeventyFive is a 75-day Hard/Soft accountability tracker for private teams.

Create or join a team, then check required tasks each local day. Production site: ${baseUrl}.

## Compatible agent clients

SeventyFive's REST API and MCP server are compatible with OpenClaw, ChatGPT Desktop, Claude Desktop, Claude Code, Claude Agent SDK, Google Gemini, OpenAI Agents SDK, Cursor, Windsurf, Zed, Goose, Cline, and Microsoft Copilot Studio. Any other agent that speaks MCP or calls REST APIs can use SeventyFive too.

## API

SeventyFive provides a public REST API at \`${baseUrl}/api/v1\`. Authenticate with an API key via \`Authorization: Bearer sf_k_...\` (create a key in Account settings).

- \`GET /api/v1/teams\` — Teams the authenticated user belongs to
- \`GET /api/v1/teams/{teamId}/board\` — Board for local today (optional \`?date=YYYY-MM-DD\`)
- \`PATCH /api/v1/teams/{teamId}/tasks/{taskId}\` — Check or uncheck a required task
- \`GET /api/v1/openapi.json\` — Full OpenAPI specification

## MCP Server

SeventyFive exposes a hosted [Model Context Protocol](https://modelcontextprotocol.io) server at \`${baseUrl}/api/v1/mcp\`.

- **Transport**: Streamable HTTP (stateless)
- **Auth**: API key via \`Authorization: Bearer sf_k_...\`

### Tools

| Tool | Description |
|---|---|
| list_teams | Teams the user belongs to (id, name, dates, mode, status, local today) |
| get_board | One team's board: tasks for a date, remaining work, progress, roster |
| set_task | Check or uncheck a required task. Same Hard fail / Soft edit rules as the board |

Create an API key at ${baseUrl}/settings, then call REST or add the MCP server to Cursor or Claude with that Bearer token.
`;

  return new Response(text, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
