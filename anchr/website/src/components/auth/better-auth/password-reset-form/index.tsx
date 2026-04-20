"use client";

import { SiteWordmark } from "@/components/marketing/site-wordmark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/better-auth/client";
import { type ForgotPasswordEmailValues, forgotPasswordEmailSchema } from "@/lib/schemas/auth";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

// Request-side form. BA's sendResetPassword flow sends a link containing a
// `token` query param; a separate page consumes the token via
// authClient.resetPassword({ newPassword, token }).
export const BetterAuthPasswordResetForm: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const [sent, setSent] = React.useState(false);
  const form = useForm<ForgotPasswordEmailValues>({ resolver: standardSchemaResolver(forgotPasswordEmailSchema) });

  //* Handlers
  const onSubmit = async (data: ForgotPasswordEmailValues) => {
    const result = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: "/update-password",
    });
    if (result.error != null) {
      form.setError("root", { message: result.error.message ?? t("somethingWentWrongPleaseTryAgain") });
      return;
    }
    setSent(true);
  };

  return (
    <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" variant="featured">
      <div className="flex flex-col items-center">
        <span className="tracking-anc-caps-extra text-xs text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
        <SiteWordmark size="xl" />
      </div>
      <CardHeader className="mt-[8vh] w-full max-w-sm items-center text-center">
        <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("resetYourPassword")}</CardTitle>
        <CardDescription className="text-[rgb(var(--m-muted))]">
          {sent ? t("checkYourEmailForAResetLink") : t("enterYourEmailToReceiveAResetLink")}
        </CardDescription>
      </CardHeader>
      {!sent && (
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
            {form.formState.errors.root != null && (
              <p className="text-center text-xs text-[rgb(var(--m-accent))]">{form.formState.errors.root.message}</p>
            )}
            <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t("sendResetLink")}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
};
