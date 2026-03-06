import { z } from "zod";

export const waitlistSchema = z.object({
  email: z.email(),
});

export type WaitlistValues = z.infer<typeof waitlistSchema>;
