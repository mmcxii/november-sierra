"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

export type WaitlistErrorKey =
  | "pleaseEnterAValidEmailAddress"
  | "somethingWentWrongPleaseTryAgain"
  | "thisEmailIsAlreadyOnTheWaitlist"
  | "tooManyRequestsPleaseTryAgainLater";

export type WaitlistState = {
  error?: WaitlistErrorKey;
  success: boolean;
};

const emailSchema = z.email();

export async function joinWaitlist(_prevState: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const raw = formData.get("email");
  const result = emailSchema.safeParse(raw);

  if (!result.success) {
    return { error: "pleaseEnterAValidEmailAddress", success: false };
  }

  try {
    const client = await clerkClient();
    await client.waitlistEntries.create({ emailAddress: result.data });
    return { success: true };
  } catch (err: unknown) {
    const clerkError = err as { errors?: { code?: string }[]; status?: number };
    const status = clerkError.status;
    const code = clerkError.errors?.[0]?.code;

    if (status === 422 || code === "form_identifier_exists") {
      return { error: "thisEmailIsAlreadyOnTheWaitlist", success: false };
    }

    if (status === 429) {
      return { error: "tooManyRequestsPleaseTryAgainLater", success: false };
    }

    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }
}
