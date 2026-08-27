# SeventyFive — Public REST API

## Intent

Expose the same three operations as the hosted MCP server over HTTP JSON, with Anchr-style envelopes, OpenAPI, and agent discovery files. Same API keys. Same Hard/Soft rules. No extra product surface.

## Auth

`Authorization: Bearer sf_k_…` on every REST route except `GET /api/v1/openapi.json`. Invalid or missing key → `{ error: { code: "UNAUTHORIZED", message } }` with 401. Keys are the ones created in Account settings.

## Endpoints

| Method  | Path                                    | Role                                                       |
| ------- | --------------------------------------- | ---------------------------------------------------------- |
| `GET`   | `/api/v1/teams`                         | List the authenticated user's teams (`list_teams`)         |
| `GET`   | `/api/v1/teams/{teamId}/board`          | Board for local today, or `?date=YYYY-MM-DD` (`get_board`) |
| `PATCH` | `/api/v1/teams/{teamId}/tasks/{taskId}` | Check/uncheck a required task (`set_task`)                 |

PATCH body: `{ "checked": boolean, "date"?: "YYYY-MM-DD" }`. Date defaults to the member's local today.

Success: `{ data: … }` (same payloads as the MCP tools). Errors: `{ error: { code, message } }`. CORS on every route including `OPTIONS`. `PATCH` allowed.

HTTP mapping from shared services: `NOT_FOUND` → 404, invalid date/task → 400 `VALIDATION_ERROR`, read-only day → 403 `FORBIDDEN`.

## Docs / discovery

- `GET /api/v1/openapi.json` — OpenAPI 3.1.0, BearerAuth, no envelope. MCP is not a REST path; it stays out of the spec.
- `GET /llms.txt` — product blurb, REST bullets, MCP tools table, OpenAPI link.
- `GET /.well-known/seventyfive.json` — machine-readable `api` + `mcp` pointers.

Handlers call the existing MCP service functions. No second copy of board/task logic.

## Out of scope

Interactive `/docs` UI, rate limiting, OAuth, npm stdio, invite/create/join REST, quotes.
