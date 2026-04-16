import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { createShortLinkSchema } from "@/lib/api/schemas/short-link";
import { createShortLink, listShortLinks } from "@/lib/services/short-link";
import { dispatchWebhookEvent } from "@/lib/services/webhook";
import { after } from "next/server";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.user == null) {
    return auth.response;
  }
  const result = await listShortLinks(auth.user);
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
  const parsed = createShortLinkSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }
  const result = await createShortLink(auth.user, parsed.data);
  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }
  after(() => {
    void dispatchWebhookEvent({
      data: result.data as unknown as Record<string, unknown>,
      event: "short_link.created",
      userId: auth.user.id,
    });
  });
  return apiSuccess(result.data, 201);
}

export function OPTIONS() {
  return apiOptions();
}
