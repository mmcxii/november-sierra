"use client";

import { SiteWordmark } from "@/components/marketing/site-wordmark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/better-auth/client";
import { type ResetPasswordValues, resetPasswordSchema } from "@/lib/schemas/auth";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";

type UpdatePasswordFormProps = {
  // BA's email link drops the user at /update-password?token=… ; this prop
  // is the token. Null when the user lands here without a token (we send
  // them back to /forgot-password instead of trying to render a broken form).
  token: null | string;
};

// Token-consuming half of the BA reset flow. The request half is
// ForgotPasswordForm; that form fires off the email and BA sends a link
// pointing here with `?token=…`. authClient.resetPassword consumes the token
// and updates the password.
export const UpdatePasswordForm: React.FC<UpdatePasswordFormProps> = (props) => {
  const { token } = props;

  //* State
  const { t } = useTranslation();
  const form = useForm<ResetPasswordValues>({ resolver: standardSchemaResolver(resetPasswordSchema) });

  //* Handlers
  const onSubmit = async (data: ResetPasswordValues) => {
    if (token == null) {
      form.setError("root", { message: t("yourResetLinkIsInvalidOrExpired") });
      return;
    }

    const result = await authClient.resetPassword({
      newPassword: data.newPassword,
      token,
    });

    if (result.error != null) {
      form.setError("root", { message: result.error.message ?? t("somethingWentWrongPleaseTryAgain") });
      return;
    }

    window.location.replace("/sign-in");
  };

  if (token == null) {
    return (
      <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" variant="featured">
        <div className="flex flex-col items-center">
          <span className="tracking-anc-caps-extra text-xs text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
          <SiteWordmark size="xl" />
        </div>
        <CardHeader className="mt-[8vh] w-full max-w-sm items-center text-center">
          <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("yourResetLinkIsInvalidOrExpired")}</CardTitle>
          <CardDescription className="text-[rgb(var(--m-muted))]">
            {t("requestANewResetLinkAndTryAgain")}
          </CardDescription>
        </CardHeader>
        <CardFooter className="w-full max-w-sm justify-center pt-6">
          <Link
            className="text-sm font-medium text-[rgb(var(--m-accent))] underline underline-offset-4"
            href="/forgot-password"
          >
            {t("requestANewLink")}
          </Link>
        </CardFooter>
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
        <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("setANewPassword")}</CardTitle>
        <CardDescription className="text-[rgb(var(--m-muted))]">
          {t("chooseAStrongPasswordYouHaventUsedElsewhere")}
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full max-w-sm pt-6">
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label className="text-[rgb(var(--m-text))]" htmlFor="newPassword">
              {t("newPassword")}
            </Label>
            <Input
              autoComplete="new-password"
              disabled={form.formState.isSubmitting}
              id="newPassword"
              type="password"
              {...form.register("newPassword")}
            />
            {form.formState.errors.newPassword != null && (
              <p className="text-xs text-[rgb(var(--m-accent))]">{form.formState.errors.newPassword.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[rgb(var(--m-text))]" htmlFor="confirmPassword">
              {t("confirmPassword")}
            </Label>
            <Input
              autoComplete="new-password"
              disabled={form.formState.isSubmitting}
              id="confirmPassword"
              type="password"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword != null && (
              <p className="text-xs text-[rgb(var(--m-accent))]">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          {form.formState.errors.root != null && (
            <p className="text-center text-xs text-[rgb(var(--m-accent))]">{form.formState.errors.root.message}</p>
          )}
          <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t("updatePassword")}
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
