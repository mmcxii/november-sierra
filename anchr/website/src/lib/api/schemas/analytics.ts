import { z } from "zod";

export const analyticsQuerySchema = z.object({
  end: z.string().date().optional(),
  start: z.string().date().optional(),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
