import { ensureProtocol, isSafeUrl } from "@/lib/utils/url";
import { z } from "zod";

const urlValidator = z.string().url();

export const linkSchema = z.object({
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9-]*$/, { message: "slugCanOnlyContainLowercaseLettersNumbersAndHyphens" })
    .optional()
    .or(z.literal("")),
  title: z.string().min(1).max(100),
  url: z
    .string()
    .min(1)
    .refine((val) => urlValidator.safeParse(ensureProtocol(val)).success, { message: "pleaseEnterAValidUrl" })
    .refine((val) => isSafeUrl(val), { message: "thisUrlIsNotAllowed" }),
});

export type LinkValues = z.infer<typeof linkSchema>;
