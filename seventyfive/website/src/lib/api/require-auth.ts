import { authenticateApiRequest } from "@/lib/mcp/auth";
import type { McpUser } from "@/lib/mcp/types";
import { API_ERROR_CODES } from "./errors";
import { apiError } from "./response";

type AuthResult = { response: Response; user: null } | { response: null; user: McpUser };

export async function requireApiAuth(request: Request): Promise<AuthResult> {
  const user = await authenticateApiRequest(request);

  if (user == null) {
    return {
      response: apiError(API_ERROR_CODES.UNAUTHORIZED, "Invalid or missing API key.", 401),
      user: null,
    };
  }

  return { response: null, user };
}
