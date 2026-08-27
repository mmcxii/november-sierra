# SeventyFive — Hosted MCP server for AI agents

## Intent

Let members connect Cursor, Claude, and other MCP clients to SeventyFive so an agent can check today’s tasks and read personal plus team progress. Same rules as the board. No separate product surface beyond account settings for keys.

## Auth

- Personal API keys (`sf_k_` + 32 alphanumeric), stored SHA-256 hashed with prefix/suffix for masking.
- Bearer token on `POST/GET/DELETE https://seventyfive.team/api/v1/mcp`.
- Create/revoke from Account settings. Max 5 active keys. Raw secret shown once.
- Keys belong to the Better Auth user; every tool still requires team membership.

## Tools

Three tools, Streamable HTTP, same pattern as Anchr:

| Tool         | Role                                                                                    |
| ------------ | --------------------------------------------------------------------------------------- |
| `list_teams` | Teams the user belongs to (id, name, dates, mode, status, local today).                 |
| `get_board`  | One team: today’s (or `date`) tasks, remaining work, progress summary, roster.          |
| `set_task`   | Check or uncheck a required task. Same `canEditDay` / required-task gates as the board. |

No invite codes, no create/join/delete, no quote. Compact JSON, English labels.

## Architecture

- Hosted in the Next app (`/api/v1/mcp`), `@modelcontextprotocol/sdk` Streamable HTTP + CORS.
- Domain mutation extracted from the task server action so the MCP path and the UI share one implementation.
- Board reads query completions **by team member ids**, not the global table scan.
- `llms.txt` advertises the endpoint. Settings shows URL + a copy-paste MCP config with a placeholder for the key.

## Out of scope

OAuth, npm stdio package, Pro gating, team-admin tools, regenerating invite codes.
