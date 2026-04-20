import { envSchema } from "@/lib/env";
import { Resend } from "resend";

const resend = new Resend(envSchema.RESEND_API_KEY);

type SendArgs = {
  html: string;
  subject: string;
  text: string;
  to: string;
};

async function send({ html, subject, text, to }: SendArgs): Promise<void> {
  const result = await resend.emails.send({
    from: envSchema.AUTH_EMAIL_FROM,
    html,
    subject,
    text,
    to,
  });
  if (result.error != null) {
    // Surfacing the error rather than swallowing: BA retries send failures,
    // and an unexpected exception here is logged by the BA hook wrapper.
    throw new Error(`Resend send failed: ${result.error.message}`);
  }
}

function wrap(title: string, body: string): string {
  return `<!doctype html><html><body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;"><h1 style="font-size: 20px;">${title}</h1>${body}</body></html>`;
}

export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  const title = "Verify your email";
  const body = `<p>Click the link below to verify your email address:</p><p><a href="${url}">${url}</a></p><p>This link expires in 1 hour.</p>`;
  await send({ html: wrap(title, body), subject: title, text: `Verify your email: ${url}`, to });
}

export async function sendResetPasswordEmail(to: string, url: string): Promise<void> {
  const title = "Reset your password";
  const body = `<p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`;
  await send({ html: wrap(title, body), subject: title, text: `Reset your password: ${url}`, to });
}

export async function sendChangeEmailConfirmation(to: string, url: string): Promise<void> {
  const title = "Confirm your new email";
  const body = `<p>Confirm your new email address by clicking the link below:</p><p><a href="${url}">${url}</a></p>`;
  await send({ html: wrap(title, body), subject: title, text: `Confirm your new email: ${url}`, to });
}

const OTP_TITLES: Record<"change-email" | "email-verification" | "forget-password" | "sign-in", string> = {
  "change-email": "Confirm your new email",
  "email-verification": "Your verification code",
  "forget-password": "Your password reset code",
  "sign-in": "Your sign-in code",
};

export async function sendOtpEmail(
  to: string,
  otp: string,
  kind: "change-email" | "email-verification" | "forget-password" | "sign-in",
): Promise<void> {
  const title = OTP_TITLES[kind];
  const body = `<p>Your code is:</p><p style="font-size: 24px; font-weight: 600; letter-spacing: 4px;">${otp}</p><p>This code expires in 10 minutes.</p>`;
  await send({ html: wrap(title, body), subject: title, text: `Your code: ${otp}`, to });
}

export async function sendTwoFactorOtpEmail(to: string, otp: string): Promise<void> {
  const title = "Your two-factor authentication code";
  const body = `<p>Your code is:</p><p style="font-size: 24px; font-weight: 600; letter-spacing: 4px;">${otp}</p><p>This code expires in 5 minutes.</p>`;
  await send({ html: wrap(title, body), subject: title, text: `Your 2FA code: ${otp}`, to });
}

type RecoveryAuditKind = "attempted" | "regenerated" | "used";

const AUDIT_TITLES: Record<RecoveryAuditKind, string> = {
  attempted: "A recovery code attempt was made on your account",
  regenerated: "Your account recovery codes were regenerated",
  used: "A recovery code was used on your account",
};

export async function sendRecoveryCodeAuditEmail(
  to: string,
  kind: RecoveryAuditKind,
  context: { ip?: null | string; timestamp: Date },
): Promise<void> {
  const title = AUDIT_TITLES[kind];
  const ipFragment = context.ip != null ? ` from IP ${context.ip}` : "";
  const body = `<p>${title} at ${context.timestamp.toISOString()}${ipFragment}.</p><p>If this wasn't you, sign in and regenerate your recovery codes immediately, then contact support.</p>`;
  await send({ html: wrap(title, body), subject: title, text: title, to });
}
