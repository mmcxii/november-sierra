import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions } from "@/lib/api/response";
import { patchTaskBodySchema } from "@/lib/api/schemas/task";
import { serviceResultToResponse } from "@/lib/api/service-result";
import { setTask } from "@/lib/mcp/services/tasks";

type RouteContext = { params: Promise<{ taskId: string; teamId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth.user == null) {
    return auth.response;
  }

  const { taskId, teamId } = await context.params;
  if (taskId.length === 0) {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "taskId is required.", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid JSON body.", 400);
  }

  const parsed = patchTaskBodySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => {
        return issue.message;
      })
      .join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  const result = await setTask(auth.user, {
    checked: parsed.data.checked,
    date: parsed.data.date,
    taskId,
    teamId,
  });
  return serviceResultToResponse(result);
}

export function OPTIONS() {
  return apiOptions();
}
