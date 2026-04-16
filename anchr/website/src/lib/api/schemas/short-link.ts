import { z } from "zod";

// 2048 chars matches the browser URL length that virtually all real-world
// destinations fit inside; longer URLs are almost always attempts at
// compression attacks or mistakes. Caps the write-amplification surface
// regardless of destination content.
const URL_MAX = 2048;

export const createShortLinkSchema = z
  .object({
    customSlug: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]*$/)
      .optional(),
    expiresAt: z.string().datetime().optional(),
    password: z.string().min(1).max(128).optional(),
    url: z.string().min(1).max(URL_MAX),
  })
  .strict();

export const updateShortLinkSchema = z
  .object({
    customSlug: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]*$/)
      .nullable()
      .optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    password: z.string().min(1).max(128).nullable().optional(),
    url: z.string().min(1).max(URL_MAX).optional(),
  })
  .strict();

export const bulkCreateShortLinksSchema = z
  .object({
    urls: z
      .array(z.object({ url: z.string().min(1).max(URL_MAX) }))
      .min(1)
      .max(50),
  })
  .strict();

export type CreateShortLinkInput = z.infer<typeof createShortLinkSchema>;
export type UpdateShortLinkInput = z.infer<typeof updateShortLinkSchema>;
export type BulkCreateShortLinksInput = z.infer<typeof bulkCreateShortLinksSchema>;
