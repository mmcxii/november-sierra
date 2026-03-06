import { z } from "zod";

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const verifyEmailSchema = z.object({
  code: z.string().min(1),
});

export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;
