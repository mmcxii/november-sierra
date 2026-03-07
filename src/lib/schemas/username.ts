import { z } from "zod";

export const RESERVED_USERNAMES = [
  "about",
  "admin",
  "analytics",
  "anchr",
  "api",
  "app",
  "billing",
  "blog",
  "dashboard",
  "ftp",
  "help",
  "localhost",
  "mail",
  "onboarding",
  "pricing",
  "settings",
  "sign-in",
  "sign-up",
  "support",
  "www",
] as const;

export const usernameSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9][a-z0-9_]*$/)
    .refine((val) => !RESERVED_USERNAMES.includes(val as (typeof RESERVED_USERNAMES)[number]), {
      message: "This username is reserved.",
    }),
});

export type UsernameValues = z.infer<typeof usernameSchema>;
