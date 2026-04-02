import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { getClickHistory } from "@/lib/mcp/services/analytics";
import { parseDateRange } from "../../_utils";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.user == null) {
    return auth.response;
  }
  const { end, start } = parseDateRange(new URL(request.url));
  const result = await getClickHistory(auth.user, { end: end?.toISOString(), start: start?.toISOString() });
  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }
  return apiSuccess(result.data);
}

export function OPTIONS() {
  return apiOptions();
}
