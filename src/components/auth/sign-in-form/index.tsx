"use client";

import { SiteWordmark } from "@/components/marketing/site-wordmark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type SignInValues, type VerifyEmailValues, signInSchema, verifyEmailSchema } from "@/lib/schemas/auth";
import { useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";

export const SignInForm: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const { isLoaded, setActive, signIn } = useSignIn();
  const [verifying, setVerifying] = React.useState(false);
  const signInForm = useForm<SignInValues>({ resolver: standardSchemaResolver(signInSchema) });
  const verifyForm = useForm<VerifyEmailValues>({ resolver: standardSchemaResolver(verifyEmailSchema) });

  //* Handlers
  const handleClerkError = (form: { setError: (name: "root", error: { message: string }) => void }, err: unknown) => {
    if (isClerkAPIResponseError(err)) {
      for (const e of err.errors) {
        form.setError("root", { message: e.longMessage ?? e.message });
      }
    } else {
      form.setError("root", { message: t("somethingWentWrongPleaseTryAgain") });
    }
  };

  const onSignIn = async (data: SignInValues) => {
    if (!isLoaded) {
      return;
    }

    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
        strategy: "password",
      });

      if (result.status === "complete") {
        void setActive({ session: result.createdSessionId });
        window.location.replace("/dashboard");
        return;
      } else if (result.status === "needs_second_factor" || (result.status as string) === "needs_client_trust") {
        const emailFactor = result.supportedSecondFactors?.find((f) => f.strategy === "email_code");

        if (emailFactor != null) {
          await signIn.prepareSecondFactor({ strategy: "email_code" });
          setVerifying(true);
        }
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        for (const e of err.errors) {
          switch (e.meta?.paramName) {
            case "identifier":
              signInForm.setError("email", { message: e.longMessage ?? e.message });
              break;

            case "password":
              signInForm.setError("password", { message: e.longMessage ?? e.message });
              break;

            default:
              signInForm.setError("root", { message: e.longMessage ?? e.message });
              break;
          }
        }
      } else {
        signInForm.setError("root", { message: t("somethingWentWrongPleaseTryAgain") });
      }
    }
  };

  const onVerify = async (data: VerifyEmailValues) => {
    if (!isLoaded) {
      return;
    }

    try {
      const result = await signIn.attemptSecondFactor({ code: data.code, strategy: "email_code" });

      if (result.status === "complete") {
        void setActive({ session: result.createdSessionId });
        window.location.replace("/dashboard");
        return;
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
      await signIn.prepareSecondFactor({ strategy: "email_code" });
    } catch (err) {
      handleClerkError(verifyForm, err);
    }
  };

  if (verifying) {
    return (
      <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" key="verify" variant="featured">
        <div className="flex flex-col items-center">
          <span className="tracking-anc-caps-extra text-xs text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
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
    <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" key="sign-in" variant="featured">
      <div className="flex flex-col items-center">
        <span className="tracking-anc-caps-extra text-xs text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
        <SiteWordmark size="xl" />
      </div>
      <CardHeader className="mt-[8vh] w-full max-w-sm items-center text-center">
        <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("signIn")}</CardTitle>
        <CardDescription className="text-[rgb(var(--m-muted))]">{t("welcomeBack")}</CardDescription>
      </CardHeader>
      <CardContent className="w-full max-w-sm pt-6">
        <form className="flex flex-col gap-4" onSubmit={signInForm.handleSubmit(onSignIn)}>
          <div className="flex flex-col gap-2">
            <Label className="text-[rgb(var(--m-text))]" htmlFor="email">
              {t("email")}
            </Label>
            <Input
              autoComplete="email"
              className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))] placeholder:text-[rgb(var(--m-muted))]/50 focus-visible:border-[rgb(var(--m-accent))]/50 focus-visible:ring-[rgb(var(--m-accent))]/20"
              disabled={signInForm.formState.isSubmitting}
              id="email"
              placeholder="you@example.com"
              type="email"
              {...signInForm.register("email")}
            />
            {signInForm.formState.errors.email != null && (
              <p className="text-xs text-[rgb(var(--m-accent))]">{signInForm.formState.errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[rgb(var(--m-text))]" htmlFor="password">
              {t("password")}
            </Label>
            <Input
              autoComplete="current-password"
              className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))] placeholder:text-[rgb(var(--m-muted))]/50 focus-visible:border-[rgb(var(--m-accent))]/50 focus-visible:ring-[rgb(var(--m-accent))]/20"
              disabled={signInForm.formState.isSubmitting}
              id="password"
              type="password"
              {...signInForm.register("password")}
            />
            {signInForm.formState.errors.password != null && (
              <p className="text-xs text-[rgb(var(--m-accent))]">{signInForm.formState.errors.password.message}</p>
            )}
          </div>
          {signInForm.formState.errors.root != null && (
            <p className="text-center text-xs text-[rgb(var(--m-accent))]">
              {signInForm.formState.errors.root.message}
            </p>
          )}
          <Button className="w-full" disabled={!isLoaded || signInForm.formState.isSubmitting} type="submit">
            {signInForm.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t("continue")}
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
                  href="/sign-up"
                />
              ),
            }}
            i18nKey="dontHaveAnAccountSignUp"
          />
        </p>
      </CardFooter>
    </Card>
  );
};
