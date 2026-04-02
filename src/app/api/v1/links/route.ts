import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { createLinkSchema } from "@/lib/api/schemas/link";
import { createLink, listLinks } from "@/lib/mcp/services/link";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.user == null) {
    return auth.response;
  }
  const result = await listLinks(auth.user);
  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }
  return apiSuccess(result.data);
}

export async function POST(request: Request) {
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
  const parsed = createLinkSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }
  const result = await createLink(auth.user, parsed.data);
  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }
  return apiSuccess(result.data, 201);
}

export function OPTIONS() {
  return apiOptions();
}
