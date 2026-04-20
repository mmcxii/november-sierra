"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/better-auth/client";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { type ChangeValues, type ReverifyValues, changeSchema, reverifySchema } from "./schemas";

// Email change flow for Better Auth — two steps:
//
// 1. Re-verify the current password (extra friction before a security-
//    sensitive change, and sets the session's reverified_at timestamp the
//    ticket calls out).
// 2. Enter the new email. BA sends a confirmation link to the new address;
//    clicking it completes the change. We don't proxy the OTP entry in-UI
//    because BA uses email-link confirmation for change-email (the OTP
//    plugin is for sign-in and password-reset).

type BetterAuthEmailChangeFormProps = {
  currentEmail: string;
};

export const BetterAuthEmailChangeForm: React.FC<BetterAuthEmailChangeFormProps> = (props) => {
  const { currentEmail } = props;

  //* State
  const { t } = useTranslation();
  const [step, setStep] = React.useState<"done" | "new-email" | "reverify">("reverify");
  const [sentTo, setSentTo] = React.useState<null | string>(null);
  const reverifyForm = useForm<ReverifyValues>({ resolver: standardSchemaResolver(reverifySchema) });
  const changeForm = useForm<ChangeValues>({ resolver: standardSchemaResolver(changeSchema) });

  //* Handlers
  const onReverify = async (data: ReverifyValues) => {
    // BA exposes `signIn.email` for credential verification; calling it here
    // with the current email + entered password both validates the password
    // and refreshes the session. We don't want a user change on a wrong
    // password to succeed, and this is the simplest way to prove the user
    // holds the credential.
    const result = await authClient.signIn.email({ email: currentEmail, password: data.password });
    if (result.error != null) {
      reverifyForm.setError("password", { message: t("thatPasswordIsIncorrect") });
      return;
    }
    setStep("new-email");
  };

  const onChange = async (data: ChangeValues) => {
    if (data.newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      changeForm.setError("newEmail", { message: t("thatsTheSameEmailYouAlreadyHave") });
      return;
    }
    const result = await authClient.changeEmail({
      callbackURL: "/dashboard/settings",
      newEmail: data.newEmail,
    });
    if (result.error != null) {
      changeForm.setError("newEmail", { message: result.error.message ?? t("somethingWentWrongPleaseTryAgain") });
      return;
    }
    setSentTo(data.newEmail);
    setStep("done");
  };

  if (step === "done" && sentTo != null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("checkYourNewEmail")}</CardTitle>
          <CardDescription>
            {t("weSentAConfirmationLinkTo{{email}}ClickItToFinishTheChange", { email: sentTo })}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (step === "new-email") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("enterYourNewEmail")}</CardTitle>
          <CardDescription>{t("wellSendAConfirmationLinkToTheNewAddress")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={changeForm.handleSubmit(onChange)}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-email">{t("newEmail")}</Label>
              <Input
                autoComplete="email"
                disabled={changeForm.formState.isSubmitting}
                id="new-email"
                placeholder="you@example.com"
                type="email"
                {...changeForm.register("newEmail")}
              />
              {changeForm.formState.errors.newEmail != null && (
                <p className="text-xs text-[rgb(var(--m-accent))]">{changeForm.formState.errors.newEmail.message}</p>
              )}
            </div>
            <Button disabled={changeForm.formState.isSubmitting} type="submit">
              {changeForm.formState.isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("sendConfirmationLink")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("confirmItsYou")}</CardTitle>
        <CardDescription>{t("reEnterYourPasswordToChangeYourEmail")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={reverifyForm.handleSubmit(onReverify)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="current-password">{t("currentPassword")}</Label>
            <Input
              autoComplete="current-password"
              disabled={reverifyForm.formState.isSubmitting}
              id="current-password"
              type="password"
              {...reverifyForm.register("password")}
            />
            {reverifyForm.formState.errors.password != null && (
              <p className="text-xs text-[rgb(var(--m-accent))]">{reverifyForm.formState.errors.password.message}</p>
            )}
          </div>
          <Button disabled={reverifyForm.formState.isSubmitting} type="submit">
            {reverifyForm.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t("continue")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
