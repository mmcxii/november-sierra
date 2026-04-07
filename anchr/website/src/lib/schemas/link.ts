import { isNpub } from "@/lib/nostr";
import { BLOCKED_PROTOCOLS, ensureProtocol } from "@/lib/utils/url";
import { z } from "zod";

const urlValidator = z.string().url();

export const linkSchema = z.object({
  groupId: z.string().optional().or(z.literal("")),
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9-]*$/, { message: "pathCanOnlyContainLowercaseLettersNumbersAndHyphens" })
    .optional()
    .or(z.literal("")),
  title: z.string().min(1).max(100),
  url: z
    .string()
    .min(1)
    .refine((val) => isNpub(val) || urlValidator.safeParse(ensureProtocol(val)).success, {
      message: "pleaseEnterAValidUrl",
    })
    .refine((val) => isNpub(val) || !BLOCKED_PROTOCOLS.test(val.trim()), { message: "thisUrlIsNotAllowed" }),
});

export type LinkValues = z.infer<typeof linkSchema>;
