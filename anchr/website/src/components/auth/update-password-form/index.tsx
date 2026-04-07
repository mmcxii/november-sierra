"use client";

import { SiteWordmark } from "@/components/marketing/site-wordmark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  type ForgotPasswordEmailValues,
  type ResetPasswordValues,
  forgotPasswordEmailSchema,
  resetPasswordSchema,
} from "@/lib/schemas/auth";
import { useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";

export const UpdatePasswordForm: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const { isLoaded, signIn } = useSignIn();
  const [step, setStep] = React.useState<"email" | "reset">("email");
  const emailForm = useForm<ForgotPasswordEmailValues>({
    resolver: standardSchemaResolver(forgotPasswordEmailSchema),
  });
  const resetForm = useForm<ResetPasswordValues>({
    resolver: standardSchemaResolver(resetPasswordSchema),
  });

  //* Handlers
  const onEmailSubmit = async (data: ForgotPasswordEmailValues) => {
    if (!isLoaded) {
      return;
    }

    try {
      await signIn.create({ identifier: data.email, strategy: "reset_password_email_code" });
      setStep("reset");
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        for (const e of err.errors) {
          switch (e.meta?.paramName) {
            case "identifier":
              emailForm.setError("email", { message: e.longMessage ?? e.message });
              break;

            default:
              emailForm.setError("root", { message: e.longMessage ?? e.message });
              break;
          }
        }
      } else {
        emailForm.setError("root", { message: t("somethingWentWrongPleaseTryAgain") });
      }
    }
  };

  const onResetSubmit = async (data: ResetPasswordValues) => {
    if (!isLoaded) {
      return;
    }

    try {
      // Step 1: Verify the code
      const codeResult = await signIn.attemptFirstFactor({
        code: data.code,
        strategy: "reset_password_email_code",
      });

      if (codeResult.status === "needs_new_password") {
        // Step 2: Set the new password
        const passwordResult = await signIn.resetPassword({ password: data.newPassword });

        if (passwordResult.status === "complete") {
          window.location.replace("/sign-in");
          return;
        }
      }

      if (codeResult.status === "complete") {
        window.location.replace("/sign-in");
        return;
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        for (const e of err.errors) {
          resetForm.setError("root", { message: e.longMessage ?? e.message });
        }
      } else {
        resetForm.setError("root", { message: t("somethingWentWrongPleaseTryAgain") });
      }
      resetForm.setValue("code", "");
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) {
      return;
    }

    resetForm.clearErrors("root");

    try {
      await signIn.create({ identifier: emailForm.getValues("email"), strategy: "reset_password_email_code" });
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        for (const e of err.errors) {
          resetForm.setError("root", { message: e.longMessage ?? e.message });
        }
      } else {
        resetForm.setError("root", { message: t("somethingWentWrongPleaseTryAgain") });
      }
    }
  };

  const codeValue = resetForm.watch("code");

  const handleOtpOnChange = (value: string) => {
    resetForm.setValue("code", value, { shouldValidate: true });
  };

  if (step === "reset") {
    return (
      <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" key="reset" variant="featured">
        <div className="flex flex-col items-center">
          <span className="tracking-anc-caps-extra text-xs text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
          <SiteWordmark size="xl" />
        </div>
        <CardHeader className="mt-[8vh] w-full max-w-sm items-center text-center">
          <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("resetYourPassword")}</CardTitle>
          <CardDescription className="text-[rgb(var(--m-muted))]">
            {t("enterTheCodeWeSentToYourEmailAndYourNewPassword")}
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full max-w-sm pt-6">
          <form className="flex flex-col gap-4" onSubmit={resetForm.handleSubmit(onResetSubmit)}>
            <div className="flex flex-col items-center gap-2">
              <Label className="self-start text-[rgb(var(--m-text))]">{t("verificationCode")}</Label>
              <InputOTP
                autoComplete="one-time-code"
                disabled={resetForm.formState.isSubmitting}
                maxLength={6}
                onChange={handleOtpOnChange}
                value={codeValue ?? ""}
              >
                <InputOTPGroup>
                  {[0, 1, 2].map((i) => (
                    <InputOTPSlot
                      className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))]"
                      index={i}
                      key={i}
                    />
                  ))}
                </InputOTPGroup>
                <InputOTPSeparator className="text-[rgb(var(--m-muted))]" />
                <InputOTPGroup>
                  {[3, 4, 5].map((i) => (
                    <InputOTPSlot
                      className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))]"
                      index={i}
                      key={i}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {resetForm.formState.errors.code != null && (
                <p className="text-xs text-[rgb(var(--m-accent))]">{resetForm.formState.errors.code.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-[rgb(var(--m-text))]" htmlFor="newPassword">
                {t("newPassword")}
              </Label>
              <Input
                autoComplete="new-password"
                className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))] placeholder:text-[rgb(var(--m-muted))]/50 focus-visible:border-[rgb(var(--m-accent))]/50 focus-visible:ring-[rgb(var(--m-accent))]/20"
                disabled={resetForm.formState.isSubmitting}
                id="newPassword"
                type="password"
                {...resetForm.register("newPassword")}
              />
              {resetForm.formState.errors.newPassword != null && (
                <p className="text-xs text-[rgb(var(--m-accent))]">{resetForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-[rgb(var(--m-text))]" htmlFor="confirmPassword">
                {t("confirmPassword")}
              </Label>
              <Input
                autoComplete="new-password"
                className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))] placeholder:text-[rgb(var(--m-muted))]/50 focus-visible:border-[rgb(var(--m-accent))]/50 focus-visible:ring-[rgb(var(--m-accent))]/20"
                disabled={resetForm.formState.isSubmitting}
                id="confirmPassword"
                type="password"
                {...resetForm.register("confirmPassword")}
              />
              {resetForm.formState.errors.confirmPassword != null && (
                <p className="text-xs text-[rgb(var(--m-accent))]">
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            {resetForm.formState.errors.root != null && (
              <p className="text-center text-xs text-[rgb(var(--m-accent))]">
                {resetForm.formState.errors.root.message}
              </p>
            )}
            <Button className="w-full" disabled={!isLoaded || resetForm.formState.isSubmitting} type="submit">
              {resetForm.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t("updatePassword")}
            </Button>
            <Button
              className="w-full"
              disabled={resetForm.formState.isSubmitting}
              onClick={handleResendCode}
              type="button"
              variant="tertiary"
            >
              {t("resendCode")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="w-full max-w-sm justify-center pt-6">
          <p className="text-sm text-[rgb(var(--m-muted))]">
            <Trans
              components={{
                1: (
                  <Link
                    className="font-medium text-[rgb(var(--m-accent))] underline underline-offset-4"
                    href="/sign-in"
                  />
                ),
              }}
              i18nKey="backToSignIn"
            />
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" key="email" variant="featured">
      <div className="flex flex-col items-center">
        <span className="tracking-anc-caps-extra text-xs text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
        <SiteWordmark size="xl" />
      </div>
      <CardHeader className="mt-[8vh] w-full max-w-sm items-center text-center">
        <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("forgotYourPassword")}</CardTitle>
        <CardDescription className="text-[rgb(var(--m-muted))]">
          {t("enterYourEmailAndWellSendYouACodeToResetYourPassword")}
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full max-w-sm pt-6">
        <form className="flex flex-col gap-4" onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
          <div className="flex flex-col gap-2">
            <Label className="text-[rgb(var(--m-text))]" htmlFor="email">
              {t("email")}
            </Label>
            <Input
              autoComplete="email"
              className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))] placeholder:text-[rgb(var(--m-muted))]/50 focus-visible:border-[rgb(var(--m-accent))]/50 focus-visible:ring-[rgb(var(--m-accent))]/20"
              disabled={emailForm.formState.isSubmitting}
              id="email"
              placeholder="you@example.com"
              type="email"
              {...emailForm.register("email")}
            />
            {emailForm.formState.errors.email != null && (
              <p className="text-xs text-[rgb(var(--m-accent))]">{emailForm.formState.errors.email.message}</p>
            )}
          </div>
          {emailForm.formState.errors.root != null && (
            <p className="text-center text-xs text-[rgb(var(--m-accent))]">{emailForm.formState.errors.root.message}</p>
          )}
          <Button className="w-full" disabled={!isLoaded || emailForm.formState.isSubmitting} type="submit">
            {emailForm.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t("sendResetCode")}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="w-full max-w-sm justify-center pt-6">
        <p className="text-sm text-[rgb(var(--m-muted))]">
          <Trans
            components={{
              1: (
                <Link
                  className="font-medium text-[rgb(var(--m-accent))] underline underline-offset-4"
                  href="/sign-in"
                />
              ),
            }}
            i18nKey="backToSignIn"
          />
        </p>
      </CardFooter>
    </Card>
  );
};
