"use client";

import { RecoveryCodesDisplay } from "@/components/auth/better-auth/recovery-codes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_RENUDGE_DAYS } from "./constants";

// Enrollment banner for migrated Clerk users who don't yet have recovery
// codes. Non-blocking; dismissal is persisted via a server action so the
// banner hides across sessions until either the user enrolls or the re-nudge
// delay passes.

type RecoveryEnrollmentBannerProps = {
  dismissedAt: null | Date;
  // Provided by parent so this component can stay a pure client surface — the
  // actual DB call lives in a server action that the parent wires in.
  renudgeAfterDays?: number;
  onDismissed: () => Promise<unknown>;
};

export const RecoveryEnrollmentBanner: React.FC<RecoveryEnrollmentBannerProps> = (props) => {
  const { dismissedAt, onDismissed, renudgeAfterDays = DEFAULT_RENUDGE_DAYS } = props;

  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const [codes, setCodes] = React.useState<null | string[]>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<null | string>(null);
  const [dismissing, setDismissing] = React.useState(false);
  // Locally hide the banner the moment dismissal completes. The server
  // component decides authoritatively on the next render (banner is null
  // once recovery codes exist or the dismissedAt timestamp is fresh), but
  // dismissedAt is a server prop so it doesn't change in-place — without
  // this flag the banner snaps back to the generate prompt after closing
  // the codes view.
  const [hiddenLocally, setHiddenLocally] = React.useState(false);

  //* Variables
  const shouldShow = React.useMemo(() => {
    if (dismissedAt == null) {
      return true;
    }
    const elapsedMs = Date.now() - dismissedAt.getTime();
    const renudgeAfterMs = renudgeAfterDays * 24 * 60 * 60 * 1000;
    return elapsedMs >= renudgeAfterMs;
  }, [dismissedAt, renudgeAfterDays]);

  //* Handlers
  const handleEnroll = async () => {
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

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await onDismissed();
      setHiddenLocally(true);
      router.refresh();
    } finally {
      setDismissing(false);
    }
  };

  const handleCodesClosed = async () => {
    setCodes(null);
    setHiddenLocally(true);
    // Enrollment is a terminal dismissal — the user won't see the banner
    // again unless they explicitly regenerate from settings and then revisit
    // the migrated-user path, which doesn't happen.
    await onDismissed();
    router.refresh();
  };

  //* Early return — nothing to show

  if (hiddenLocally || !shouldShow) {
    return null;
  }

  if (codes != null) {
    return <RecoveryCodesDisplay codes={codes} onClose={handleCodesClosed} />;
  }

  return (
    <Card className="relative">
      <button
        aria-label={t("dismiss")}
        className="absolute top-2 right-2 rounded p-1 text-[rgb(var(--m-muted))] hover:bg-[var(--m-embed-bg)]"
        disabled={dismissing}
        onClick={handleDismiss}
        type="button"
      >
        <X className="size-4" />
      </button>
      <CardHeader>
        <CardTitle>{t("setUpAccountRecovery")}</CardTitle>
        <CardDescription>
          {t("printOrSave10OneTimeCodesSoYouCanRecoverYourAccountIfYouLoseAccessToYourEmail")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error != null && <p className="mb-2 text-xs text-[rgb(var(--m-accent))]">{error}</p>}
        <Button disabled={loading} onClick={handleEnroll} type="button">
          {loading ? <Loader2 className="size-4 animate-spin" /> : t("generateRecoveryCodes")}
        </Button>
      </CardContent>
    </Card>
  );
};
