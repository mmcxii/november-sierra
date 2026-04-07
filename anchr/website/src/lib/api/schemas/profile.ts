import { z } from "zod";

export const updateProfileSchema = z
  .object({
    bio: z.string().max(500).optional(),
    displayName: z.string().max(100).optional(),
    pageDarkTheme: z.string().max(100).optional(),
    pageLightTheme: z.string().max(100).optional(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
