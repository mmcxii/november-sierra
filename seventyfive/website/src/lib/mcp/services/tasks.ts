import { getMembershipContextForUser } from "@/lib/auth/session";
import { setTaskCheckedForMembership } from "@/lib/challenge/set-task";
import { localDateString } from "@/lib/challenge/tasks";
import { english } from "@/lib/mcp/english";
import { serviceError, serviceSuccess, type McpUser, type ServiceResult } from "@/lib/mcp/types";

export type SetTaskInput = {
  checked: boolean;
  date?: string;
  taskId: string;
  teamId: string;
};

export async function setTask(
  user: McpUser,
  input: SetTaskInput,
): Promise<ServiceResult<{ checked: boolean; date: string; taskId: string; teamCelebration: boolean }>> {
  const session = await getMembershipContextForUser(user.id, input.teamId);
  if (session == null) {
    return serviceError("NOT_FOUND", "You are not a member of that team.");
  }

  const date = input.date ?? localDateString(new Date(), session.user.timeZone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return serviceError("INVALID_DATE", "date must be YYYY-MM-DD.");
  }

  const result = await setTaskCheckedForMembership(session, {
    checked: input.checked,
    date,
    taskId: input.taskId,
  });

  if ("error" in result) {
    return serviceError(result.error, english(result.error));
  }

  return serviceSuccess({
    checked: input.checked,
    date,
    taskId: input.taskId,
    teamCelebration: result.teamCelebration,
  });
}
