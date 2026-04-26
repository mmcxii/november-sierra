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
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
});

export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordEmailSchema = z.object({
  email: z.email(),
});

export type ForgotPasswordEmailValues = z.infer<typeof forgotPasswordEmailSchema>;

// Token-based reset (post ANC-152). BA's reset-password flow embeds a token
// in the email link; the new-password form validates min length + match.
export const resetPasswordSchema = z
  .object({
    confirmPassword: z.string().min(8),
    newPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
