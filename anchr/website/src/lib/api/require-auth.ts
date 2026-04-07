import { type ApiKeyUser, authenticateApiRequest } from "./auth";
import { API_ERROR_CODES } from "./errors";
import { apiError } from "./response";

type AuthResult = { response: Response; user: null } | { response: null; user: ApiKeyUser };

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

export function requirePro(user: ApiKeyUser): null | Response {
  if (user.tier !== "pro") {
    return apiError(API_ERROR_CODES.PRO_REQUIRED, "This endpoint requires a Pro subscription.", 403);
  }

  return null;
}
