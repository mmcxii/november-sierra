"use server";

import { getMembershipContext } from "@/lib/auth/session";
import { setTaskCheckedForMembership } from "@/lib/challenge/set-task";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const setTaskSchema = z.object({
  checked: z.boolean(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taskId: z.string().min(1),
  teamId: z.string().min(1),
});

export async function setTaskCheckedAction(input: z.infer<typeof setTaskSchema>) {
  const parsed = setTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" as const };
  }

  const session = await getMembershipContext(parsed.data.teamId);
  if (session == null) {
    return { error: "somethingWentWrong" as const };
  }

  const result = await setTaskCheckedForMembership(session, {
    checked: parsed.data.checked,
    date: parsed.data.date,
    taskId: parsed.data.taskId,
  });
  if ("error" in result) {
    return result;
  }

  revalidatePath(`/teams/${parsed.data.teamId}`);
  return result;
}
