"use client";

import { SiteWordmark } from "@/components/marketing/site-wordmark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { authClient } from "@/lib/better-auth/client";
import { type VerifyEmailValues, verifyEmailSchema } from "@/lib/schemas/auth";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export const BetterAuthTwoFactorForm: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const form = useForm<VerifyEmailValues>({ resolver: standardSchemaResolver(verifyEmailSchema) });
  const codeValue = form.watch("code");

  //* Handlers
  const onSubmit = React.useCallback(
    async (data: VerifyEmailValues) => {
      const result = await authClient.twoFactor.verifyOtp({ code: data.code });
      if (result.error != null) {
        form.setError("code", { message: result.error.message ?? t("somethingWentWrongPleaseTryAgain") });
        form.setValue("code", "");
        return;
      }
      window.location.replace("/dashboard");
    },
    [form, t],
  );

  const handleResend = async () => {
    const result = await authClient.twoFactor.sendOtp();
    if (result.error != null) {
      form.setError("root", { message: result.error.message ?? t("somethingWentWrongPleaseTryAgain") });
    }
  };

  const handleOtpChange = (v: string) => {
    form.setValue("code", v, { shouldValidate: true });
  };

  //* Effects
  React.useEffect(() => {
    if (/^\d{6}$/.test(codeValue) && !form.formState.isSubmitting) {
      void form.handleSubmit(onSubmit)();
    }
  }, [codeValue, form, onSubmit]);

  return (
    <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" variant="featured">
      <div className="flex flex-col items-center">
        <span className="tracking-anc-caps-extra text-xs text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
        <SiteWordmark size="xl" />
      </div>
      <CardHeader className="mt-[8vh] w-full max-w-sm items-center text-center">
        <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("twoFactorAuthentication")}</CardTitle>
        <CardDescription className="text-[rgb(var(--m-muted))]">{t("enterTheCodeWeSentToYourEmail")}</CardDescription>
      </CardHeader>
      <CardContent className="flex w-full max-w-sm flex-col items-center pt-6">
        <InputOTP
          autoComplete="one-time-code"
          disabled={form.formState.isSubmitting}
          maxLength={6}
          onChange={handleOtpChange}
          value={codeValue}
        >
          <InputOTPGroup>
            {[0, 1, 2].map((i) => (
              <InputOTPSlot index={i} key={i} />
            ))}
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            {[3, 4, 5].map((i) => (
              <InputOTPSlot index={i} key={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {form.formState.isSubmitting && <Loader2 className="mt-4 size-4 animate-spin text-[rgb(var(--m-muted))]" />}
        {form.formState.errors.code != null && (
          <p className="mt-2 text-xs text-[rgb(var(--m-accent))]">{form.formState.errors.code.message}</p>
        )}
        {form.formState.errors.root != null && (
          <p className="mt-2 text-center text-xs text-[rgb(var(--m-accent))]">{form.formState.errors.root.message}</p>
        )}
        <Button
          className="mt-4 w-full"
          disabled={form.formState.isSubmitting}
          onClick={handleResend}
          type="button"
          variant="tertiary"
        >
          {t("resendCode")}
        </Button>
        <Link
          className="mt-2 self-center text-sm font-medium text-[rgb(var(--m-accent))] underline underline-offset-4"
          href="/account-recovery"
        >
          {t("useARecoveryCodeInstead")}
        </Link>
      </CardContent>
    </Card>
  );
};
