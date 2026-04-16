import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { requirePro } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { bulkCreateShortLinksSchema } from "@/lib/api/schemas/short-link";
import { bulkCreateShortLinks } from "@/lib/services/short-link";
import { dispatchWebhookEvent } from "@/lib/services/webhook";
import { after } from "next/server";

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.user == null) {
    return auth.response;
  }
  const proError = requirePro(auth.user);
  if (proError != null) {
    return proError;
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid JSON body.", 400);
  }
  const parsed = bulkCreateShortLinksSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }
  const result = await bulkCreateShortLinks(auth.user, parsed.data.urls);
  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }
  after(() => {
    for (const shortLink of result.data) {
      void dispatchWebhookEvent({
        data: shortLink as unknown as Record<string, unknown>,
        event: "short_link.created",
        userId: auth.user.id,
      });
    }
  });
  return apiSuccess(result.data, 201);
}

export function OPTIONS() {
  return apiOptions();
}
