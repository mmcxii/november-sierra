import { z } from "zod";
import { DATE_PATTERN } from "./board";

export const patchTaskBodySchema = z
  .object({
    checked: z.boolean(),
    date: z.string().regex(DATE_PATTERN, "date must be YYYY-MM-DD").optional(),
  })
  .strict();
