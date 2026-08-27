import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions } from "@/lib/api/response";
import { boardQuerySchema } from "@/lib/api/schemas/board";
import { serviceResultToResponse } from "@/lib/api/service-result";
import { getBoard } from "@/lib/mcp/services/board";

type RouteContext = { params: Promise<{ teamId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth.user == null) {
    return auth.response;
  }

  const { teamId } = await context.params;
  const rawDate = new URL(request.url).searchParams.get("date");
  const parsed = boardQuerySchema.safeParse({
    date: rawDate == null || rawDate === "" ? undefined : rawDate,
  });
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => {
        return issue.message;
      })
      .join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  const result = await getBoard(auth.user, { date: parsed.data.date, teamId });
  return serviceResultToResponse(result);
}

export function OPTIONS() {
  return apiOptions();
}
