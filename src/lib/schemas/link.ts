import { ensureProtocol, isSafeUrl } from "@/lib/utils/url";
import { z } from "zod";

const urlValidator = z.string().url();

export const linkSchema = z.object({
  title: z.string().min(1).max(100),
  url: z
    .string()
    .min(1)
    .refine((val) => urlValidator.safeParse(ensureProtocol(val)).success, { message: "pleaseEnterAValidUrl" })
    .refine((val) => isSafeUrl(val), { message: "thisUrlIsNotAllowed" }),
});

export type LinkValues = z.infer<typeof linkSchema>;
