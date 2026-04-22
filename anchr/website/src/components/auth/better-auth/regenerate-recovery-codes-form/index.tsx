"use client";

import { RecoveryCodesDisplay } from "@/components/auth/better-auth/recovery-codes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

// Standalone regenerate flow for the BA settings page. The enrollment banner
// is single-use (first-time only) and pairs the action with the dismissal
// gesture, so this is a separate surface for users who already enrolled and
// want a fresh set. issueRecoveryCodesForUser deletes the previous set before
// inserting — hitting this button invalidates any older codes.
export const BetterAuthRegenerateRecoveryCodesForm: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const [codes, setCodes] = React.useState<null | string[]>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<null | string>(null);

  //* Handlers
  const handleRegenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/recovery-codes/generate", { method: "POST" });
      if (!res.ok) {
        setError(t("somethingWentWrongPleaseTryAgain"));
        return;
      }
      const body = (await res.json()) as { codes: string[] };
      setCodes(body.codes);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCodes(null);
  };

  if (codes != null) {
    return <RecoveryCodesDisplay codes={codes} onClose={handleClose} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recoveryCodes")}</CardTitle>
        <CardDescription>
          {t("regenerateInvalidatesYourOldCodesYoullSeeTheNewSetExactlyOnceMakeSureYouSaveThem")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error != null && <p className="mb-2 text-xs text-[rgb(var(--m-accent))]">{error}</p>}
        <Button disabled={loading} onClick={handleRegenerate} type="button" variant="secondary">
          {loading ? <Loader2 className="size-4 animate-spin" /> : t("regenerateRecoveryCodes")}
        </Button>
      </CardContent>
    </Card>
  );
};
