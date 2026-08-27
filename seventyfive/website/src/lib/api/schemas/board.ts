import { z } from "zod";

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const boardQuerySchema = z
  .object({
    date: z.string().regex(DATE_PATTERN, "date must be YYYY-MM-DD").optional(),
  })
  .strict();
