import { z } from "zod";

export const groupSchema = z.object({
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9-]*$/, { message: "pathCanOnlyContainLowercaseLettersNumbersAndHyphens" })
    .optional()
    .or(z.literal("")),
  title: z.string().min(1).max(100),
});

export type GroupValues = z.infer<typeof groupSchema>;
