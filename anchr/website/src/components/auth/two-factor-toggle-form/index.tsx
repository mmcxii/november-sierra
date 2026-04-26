"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/better-auth/client";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

type TwoFactorToggleFormProps = {
  initialEnabled: boolean;
};

// Toggle for the BA twoFactor plugin's email-OTP factor. Enabling/disabling is
// gated on the user re-entering their current password — BA's API accepts the
// password as the proof, and we surface it inline so the toggle is a single
// flow rather than a modal step.
export const TwoFactorToggleForm: React.FC<TwoFactorToggleFormProps> = (props) => {
  const { initialEnabled } = props;

  //* State
  const { t } = useTranslation();
  const [enabled, setEnabled] = React.useState(initialEnabled);
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<null | string>(null);
  const [submitting, setSubmitting] = React.useState(false);

  //* Variables
  const submitLabel = enabled ? t("disableTwoFactorAuthentication") : t("enableTwoFactorAuthentication");

  //* Handlers
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length === 0) {
      setError(t("enterYourCurrentPassword"));
      return;
    }

    setSubmitting(true);
    try {
      const result = enabled
        ? await authClient.twoFactor.disable({ password })
        : await authClient.twoFactor.enable({ password });

      if (result.error != null) {
        setError(result.error.message ?? t("somethingWentWrongPleaseTryAgain"));
        return;
      }

      setEnabled(!enabled);
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("twoFactorAuthentication")}</CardTitle>
        <CardDescription>
          {enabled
            ? t("twoFactorIsOnWellEmailYouASixDigitCodeWheneverYouSignIn")
            : t("addASecondStepAtSignInWeEmailYouASixDigitCodeAfterYouEnterYourPassword")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="two-factor-password">{t("currentPassword")}</Label>
            <Input
              autoComplete="current-password"
              disabled={submitting}
              id="two-factor-password"
              onChange={handlePasswordChange}
              type="password"
              value={password}
            />
            {error != null && <p className="text-xs text-[rgb(var(--m-accent))]">{error}</p>}
          </div>
          <Button disabled={submitting} type="submit" variant={enabled ? "secondary" : "primary"}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
