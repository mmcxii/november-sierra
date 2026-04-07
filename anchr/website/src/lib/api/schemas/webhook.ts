import { z } from "zod";

export const WEBHOOK_EVENTS = [
  "link.created",
  "link.updated",
  "link.deleted",
  "group.created",
  "group.updated",
  "group.deleted",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

const webhookEventSchema = z.enum(WEBHOOK_EVENTS);

export const createWebhookSchema = z
  .object({
    events: z.array(webhookEventSchema).min(1),
    url: z.string().url(),
  })
  .strict();

export const updateWebhookSchema = z
  .object({
    active: z.boolean().optional(),
    events: z.array(webhookEventSchema).min(1).optional(),
    url: z.string().url().optional(),
  })
  .strict();

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
