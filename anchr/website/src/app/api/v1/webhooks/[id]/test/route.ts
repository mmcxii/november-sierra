import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { sendTestEvent } from "@/lib/services/webhook";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth(request);
  if (auth.user == null) {
    return auth.response;
  }
  const { id } = await params;
  const result = await sendTestEvent(auth.user, id);
  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }
  return apiSuccess(null);
}

export function OPTIONS() {
  return apiOptions();
}
