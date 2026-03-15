"use client";

import { SiteWordmark } from "@/components/marketing/site-wordmark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type SignUpValues, type VerifyEmailValues, signUpSchema, verifyEmailSchema } from "@/lib/schemas/auth";
import { useSignUp } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";

export const SignUpForm: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const { isLoaded, setActive, signUp } = useSignUp();
  const [verifying, setVerifying] = React.useState(false);
  const signUpForm = useForm<SignUpValues>({ resolver: standardSchemaResolver(signUpSchema) });
  const verifyForm = useForm<VerifyEmailValues>({ resolver: standardSchemaResolver(verifyEmailSchema) });

  //* Handlers
  const handleClerkError = (form: { setError: (name: "root", error: { message: string }) => void }, err: unknown) => {
    if (isClerkAPIResponseError(err)) {
      for (const e of err.errors) {
        switch (e.meta?.paramName) {
          case "email_address":
            form.setError("root", { message: e.longMessage ?? e.message });
            break;

          case "password":
            form.setError("root", { message: e.longMessage ?? e.message });
            break;

          default:
            form.setError("root", { message: e.longMessage ?? e.message });
            break;
        }
      }
    } else {
      form.setError("root", { message: t("somethingWentWrongPleaseTryAgain") });
    }
  };

  const onSignUp = async (data: SignUpValues) => {
    if (!isLoaded) {
      return;
    }

    try {
      await signUp.create({ emailAddress: data.email, password: data.password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (err) {
      handleClerkError(signUpForm, err);
    }
  };

  const onVerify = async (data: VerifyEmailValues) => {
    if (!isLoaded) {
      return;
    }

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: data.code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        window.location.replace("/onboarding");
      }
    } catch (err) {
      handleClerkError(verifyForm, err);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) {
      return;
    }
    verifyForm.clearErrors("root");
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch (err) {
      handleClerkError(verifyForm, err);
    }
  };

  if (verifying) {
    return (
      <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" key="verify" variant="featured">
        <div className="flex flex-col items-center">
          <span className="text-xs tracking-[0.35em] text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
          <SiteWordmark size="xl" />
        </div>
        <CardHeader className="mt-[8vh] w-full max-w-sm items-center text-center">
          <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("checkYourEmail")}</CardTitle>
          <CardDescription className="text-[rgb(var(--m-muted))]">{t("enterTheCodeWeSentToYourEmail")}</CardDescription>
        </CardHeader>
        <CardContent className="w-full max-w-sm pt-6">
          <form className="flex flex-col gap-4" onSubmit={verifyForm.handleSubmit(onVerify)}>
            <div className="flex flex-col gap-2">
              <Label className="text-[rgb(var(--m-text))]" htmlFor="code">
                {t("verificationCode")}
              </Label>
              <Input
                autoComplete="one-time-code"
                className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))] placeholder:text-[rgb(var(--m-muted))]/50 focus-visible:border-[rgb(var(--m-accent))]/50 focus-visible:ring-[rgb(var(--m-accent))]/20"
                disabled={verifyForm.formState.isSubmitting}
                id="code"
                inputMode="numeric"
                type="text"
                {...verifyForm.register("code")}
              />
              {verifyForm.formState.errors.code != null && (
                <p className="text-xs text-[rgb(var(--m-accent))]">{verifyForm.formState.errors.code.message}</p>
              )}
            </div>
            {verifyForm.formState.errors.root != null && (
              <p className="text-center text-xs text-[rgb(var(--m-accent))]">
                {verifyForm.formState.errors.root.message}
              </p>
            )}
            <Button className="w-full" disabled={verifyForm.formState.isSubmitting} type="submit">
              {verifyForm.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t("verify")}
            </Button>
          </form>
          <Button
            className="mt-2 w-full"
            disabled={verifyForm.formState.isSubmitting}
            onClick={handleResendCode}
            type="button"
            variant="tertiary"
          >
            {t("resendCode")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" key="sign-up" variant="featured">
      <div className="flex flex-col items-center">
        <span className="text-xs tracking-[0.35em] text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
        <SiteWordmark size="xl" />
      </div>
      <CardHeader className="mt-[8vh] w-full max-w-sm items-center text-center">
        <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("createAnAccount")}</CardTitle>
        <CardDescription className="text-[rgb(var(--m-muted))]">{t("startBuildingYourPage")}</CardDescription>
      </CardHeader>
      <CardContent className="w-full max-w-sm pt-6">
        <form className="flex flex-col gap-4" onSubmit={signUpForm.handleSubmit(onSignUp)}>
          <div className="flex flex-col gap-2">
            <Label className="text-[rgb(var(--m-text))]" htmlFor="email">
              {t("email")}
            </Label>
            <Input
              autoComplete="email"
              className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))] placeholder:text-[rgb(var(--m-muted))]/50 focus-visible:border-[rgb(var(--m-accent))]/50 focus-visible:ring-[rgb(var(--m-accent))]/20"
              disabled={signUpForm.formState.isSubmitting}
              id="email"
              placeholder="you@example.com"
              type="email"
              {...signUpForm.register("email")}
            />
            {signUpForm.formState.errors.email != null && (
              <p className="text-xs text-[rgb(var(--m-accent))]">{signUpForm.formState.errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[rgb(var(--m-text))]" htmlFor="password">
              {t("password")}
            </Label>
            <Input
              autoComplete="new-password"
              className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))] placeholder:text-[rgb(var(--m-muted))]/50 focus-visible:border-[rgb(var(--m-accent))]/50 focus-visible:ring-[rgb(var(--m-accent))]/20"
              disabled={signUpForm.formState.isSubmitting}
              id="password"
              type="password"
              {...signUpForm.register("password")}
            />
            {signUpForm.formState.errors.password != null && (
              <p className="text-xs text-[rgb(var(--m-accent))]">{signUpForm.formState.errors.password.message}</p>
            )}
          </div>
          {signUpForm.formState.errors.root != null && (
            <p className="text-center text-xs text-[rgb(var(--m-accent))]">
              {signUpForm.formState.errors.root.message}
            </p>
          )}
          <Button className="w-full" disabled={!isLoaded || signUpForm.formState.isSubmitting} type="submit">
            {signUpForm.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t("continue")}
          </Button>
          <div className="-mt-4" id="clerk-captcha" />
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
            i18nKey="alreadyHaveAnAccountSignIn"
          />
        </p>
      </CardFooter>
    </Card>
  );
};
