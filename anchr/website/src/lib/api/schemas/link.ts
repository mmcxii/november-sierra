import { z } from "zod";

export const createLinkSchema = z
  .object({
    groupId: z.string().optional(),
    slug: z
      .string()
      .max(100)
      .regex(/^[a-z0-9-]*$/)
      .optional(),
    title: z.string().min(1).max(100),
    url: z.string().min(1),
  })
  .strict();

export const updateLinkSchema = z
  .object({
    groupId: z.string().nullable().optional(),
    slug: z
      .string()
      .max(100)
      .regex(/^[a-z0-9-]*$/)
      .optional(),
    title: z.string().min(1).max(100).optional(),
    url: z.string().min(1).optional(),
  })
  .strict();

export const reorderLinksSchema = z
  .object({
    items: z.array(z.object({ id: z.string(), position: z.number().int().min(0) })).min(1),
  })
  .strict();

export const bulkDeleteLinksSchema = z
  .object({
    ids: z.array(z.string()).min(1),
  })
  .strict();

export const bulkVisibilitySchema = z
  .object({
    ids: z.array(z.string()).min(1),
    visible: z.boolean(),
  })
  .strict();

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
