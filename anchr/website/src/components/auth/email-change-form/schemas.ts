import { z } from "zod";

export const reverifySchema = z.object({ password: z.string().min(1) });
export const changeSchema = z.object({ newEmail: z.email() });

export type ReverifyValues = z.infer<typeof reverifySchema>;
export type ChangeValues = z.infer<typeof changeSchema>;
