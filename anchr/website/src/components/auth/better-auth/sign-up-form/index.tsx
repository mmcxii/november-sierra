"use client";

import { SiteWordmark } from "@/components/marketing/site-wordmark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/better-auth/client";
import { type SignUpValues, signUpSchema } from "@/lib/schemas/auth";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";

export const BetterAuthSignUpForm: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const [awaitingVerification, setAwaitingVerification] = React.useState(false);
  const form = useForm<SignUpValues>({ resolver: standardSchemaResolver(signUpSchema) });

  //* Handlers
  const onSubmit = async (data: SignUpValues) => {
    const result = await authClient.signUp.email({
      email: data.email,
      // BA requires a display name at sign-up — derive from the email local-
      // part for now; the user fills in a proper name during onboarding.
      name: data.email.split("@")[0],
      password: data.password,
    });

    if (result.error != null) {
      form.setError("root", { message: result.error.message ?? t("somethingWentWrongPleaseTryAgain") });
      return;
    }

    // With requireEmailVerification=true, BA sends a verification email and
    // holds the session until the user clicks the link.
    setAwaitingVerification(true);
  };

  if (awaitingVerification) {
    return (
      <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" variant="featured">
        <div className="flex flex-col items-center">
          <span className="tracking-anc-caps-extra text-xs text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
          <SiteWordmark size="xl" />
        </div>
        <CardHeader className="mt-[8vh] w-full max-w-sm items-center text-center">
          <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("checkYourEmail")}</CardTitle>
          <CardDescription className="text-[rgb(var(--m-muted))]">
            {t("clickTheLinkInYourEmailToVerifyYourAccount")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" variant="featured">
      <div className="flex flex-col items-center">
        <span className="tracking-anc-caps-extra text-xs text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
        <SiteWordmark size="xl" />
      </div>
      <CardHeader className="mt-[8vh] w-full max-w-sm items-center text-center">
        <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("createAnAccount")}</CardTitle>
        <CardDescription className="text-[rgb(var(--m-muted))]">{t("getStartedInSeconds")}</CardDescription>
      </CardHeader>
      <CardContent className="w-full max-w-sm pt-6">
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label className="text-[rgb(var(--m-text))]" htmlFor="email">
              {t("email")}
            </Label>
            <Input
              autoComplete="email"
              disabled={form.formState.isSubmitting}
              id="email"
              placeholder="you@example.com"
              type="email"
              {...form.register("email")}
            />
            {form.formState.errors.email != null && (
              <p className="text-xs text-[rgb(var(--m-accent))]">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[rgb(var(--m-text))]" htmlFor="password">
              {t("password")}
            </Label>
            <Input
              autoComplete="new-password"
              disabled={form.formState.isSubmitting}
              id="password"
              type="password"
              {...form.register("password")}
            />
            {form.formState.errors.password != null && (
              <p className="text-xs text-[rgb(var(--m-accent))]">{form.formState.errors.password.message}</p>
            )}
          </div>
          {form.formState.errors.root != null && (
            <p className="text-center text-xs text-[rgb(var(--m-accent))]">{form.formState.errors.root.message}</p>
          )}
          <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t("continue")}
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
            i18nKey="alreadyHaveAnAccountSignIn"
          />
        </p>
      </CardFooter>
    </Card>
  );
};
