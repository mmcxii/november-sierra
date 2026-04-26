"use client";

import { SiteWordmark } from "@/components/marketing/site-wordmark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

// Flow A: user has signed in with email + password and is now sitting at the
// 2FA OTP prompt, but can't access their email. They land here and redeem one
// of their recovery codes — the recoveryCode2faBypassPlugin endpoint reads
// BA's two-factor cookie, validates the code, and sets the session cookie.
// Successful redemption lands them on /dashboard.
export const AccountRecoveryForm: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<null | string>(null);
  const [submitting, setSubmitting] = React.useState(false);

  //* Handlers
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.trim().length === 0) {
      setError(t("enterARecoveryCode"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/recovery-code-2fa-bypass", {
        body: JSON.stringify({ code: code.trim() }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      if (res.ok) {
        window.location.replace("/dashboard");
        return;
      }

      const body = (await res.json().catch(() => {
        return {};
      })) as { error?: string; lockedUntil?: string };
      if (body.error === "locked") {
        setError(t("tooManyAttemptsTryAgainLater"));
      } else if (body.error === "invalid_code") {
        setError(t("thatRecoveryCodeIsntValid"));
      } else if (body.error === "invalid_two_factor_cookie") {
        setError(t("yourSessionExpiredPleaseSignInAgain"));
      } else {
        setError(t("somethingWentWrongPleaseTryAgain"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" variant="featured">
      <div className="flex flex-col items-center">
        <span className="tracking-anc-caps-extra text-xs text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
        <SiteWordmark size="xl" />
      </div>
      <CardHeader className="mt-[8vh] w-full max-w-sm items-center text-center">
        <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("accountRecovery")}</CardTitle>
        <CardDescription className="text-[rgb(var(--m-muted))]">
          {t("enterOneOfTheRecoveryCodesYouSavedWhenYouSetUp2fa")}
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full max-w-sm pt-6">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="recovery-code">{t("recoveryCode")}</Label>
            <Input
              autoComplete="one-time-code"
              autoFocus
              disabled={submitting}
              id="recovery-code"
              onChange={handleCodeChange}
              placeholder="xxxx-xxxx-xx"
              spellCheck={false}
              type="text"
              value={code}
            />
            {error != null && <p className="text-xs text-[rgb(var(--m-accent))]">{error}</p>}
          </div>
          <Button className="w-full" disabled={submitting} type="submit">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : t("continue")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
