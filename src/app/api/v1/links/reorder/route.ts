import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { reorderLinksSchema } from "@/lib/api/schemas/link";
import { reorderLinks } from "@/lib/mcp/services/link";

export async function PATCH(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.user == null) {
    return auth.response;
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid JSON body.", 400);
  }
  const parsed = reorderLinksSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }
  const result = await reorderLinks(auth.user, parsed.data.items);
  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }
  return apiSuccess(null);
}

export function OPTIONS() {
  return apiOptions();
}
