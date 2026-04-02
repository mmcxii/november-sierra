import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { toggleLinkVisibility } from "@/lib/mcp/services/link";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth(request);
  if (auth.user == null) {
    return auth.response;
  }
  const { id } = await params;
  const result = await toggleLinkVisibility(auth.user, id);
  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }
  return apiSuccess(result.data);
}

export function OPTIONS() {
  return apiOptions();
}
