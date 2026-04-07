import { z } from "zod";

export const createGroupSchema = z
  .object({
    slug: z
      .string()
      .max(100)
      .regex(/^[a-z0-9-]*$/)
      .optional(),
    title: z.string().min(1).max(100),
  })
  .strict();

export const updateGroupSchema = z
  .object({
    slug: z
      .string()
      .max(100)
      .regex(/^[a-z0-9-]*$/)
      .optional(),
    title: z.string().min(1).max(100).optional(),
  })
  .strict();

export const reorderGroupsSchema = z
  .object({
    items: z.array(z.object({ id: z.string(), position: z.number().int().min(0) })).min(1),
  })
  .strict();

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
