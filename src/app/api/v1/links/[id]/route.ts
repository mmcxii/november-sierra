import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { updateLinkSchema } from "@/lib/api/schemas/link";
import { deleteLink, updateLink } from "@/lib/mcp/services/link";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth(request);
  if (auth.user == null) {
    return auth.response;
  }
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid JSON body.", 400);
  }
  const parsed = updateLinkSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }
  const result = await updateLink(auth.user, id, parsed.data);
  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }
  return apiSuccess(result.data);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth(request);
  if (auth.user == null) {
    return auth.response;
  }
  const { id } = await params;
  const result = await deleteLink(auth.user, id);
  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }
  return apiSuccess(null);
}

export function OPTIONS() {
  return apiOptions();
}
