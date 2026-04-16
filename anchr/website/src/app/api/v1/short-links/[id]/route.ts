import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { updateShortLinkSchema } from "@/lib/api/schemas/short-link";
import { deleteShortLink, getShortLink, updateShortLink } from "@/lib/services/short-link";
import { dispatchWebhookEvent } from "@/lib/services/webhook";
import { after } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth(request);
  if (auth.user == null) {
    return auth.response;
  }
  const { id } = await params;
  const result = await getShortLink(auth.user, id);
  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }
  return apiSuccess(result.data);
}

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
  const parsed = updateShortLinkSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }
  const result = await updateShortLink(auth.user, id, parsed.data);
  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }
  after(() => {
    void dispatchWebhookEvent({
      data: result.data as unknown as Record<string, unknown>,
      event: "short_link.updated",
      userId: auth.user.id,
    });
  });
  return apiSuccess(result.data);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth(request);
  if (auth.user == null) {
    return auth.response;
  }
  const { id } = await params;
  const result = await deleteShortLink(auth.user, id);
  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }
  after(() => {
    void dispatchWebhookEvent({
      data: { id },
      event: "short_link.deleted",
      userId: auth.user.id,
    });
  });
  return apiSuccess(null);
}

export function OPTIONS() {
  return apiOptions();
}
