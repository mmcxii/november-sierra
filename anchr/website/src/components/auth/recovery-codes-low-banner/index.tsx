"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";

// Surfaces post-sign-in when the user has burned through most of their recovery
// codes. Pure client surface — count + dismissal state come from the server
// wrapper. Dismissal is timestamp-based with the same alert-dismissal plumbing
// the enrollment banner uses, so it can re-nudge after a quiet period.

type RecoveryCodesLowBannerProps = {
  remaining: number;
  onDismissed: () => Promise<unknown>;
};

export const RecoveryCodesLowBanner: React.FC<RecoveryCodesLowBannerProps> = (props) => {
  const { onDismissed, remaining } = props;

  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const [dismissing, setDismissing] = React.useState(false);
  const [hiddenLocally, setHiddenLocally] = React.useState(false);

  //* Handlers
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

  //* Early return — nothing to show

  if (hiddenLocally) {
    return null;
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
        <CardTitle>{t("yourRecoveryCodesAreRunningLow")}</CardTitle>
        <CardDescription>
          {t("youHave{{remaining}}UnusedRecoveryCodesLeftRegenerateANewSetSoYouDontGetLockedOut", {
            remaining,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/dashboard/better-auth-settings">{t("regenerateRecoveryCodes")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
