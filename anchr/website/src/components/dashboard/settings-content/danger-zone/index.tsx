"use client";

import {
  type AccountDeletionSummary,
  deleteMyAccount,
  fetchAccountDeletionSummary,
} from "@/app/(dashboard)/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { TranslationKey } from "@/lib/i18n/i18next.d";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatAccountAge } from "./format-account-age";
import { SummaryRow } from "./summary-row";

type DangerZoneProps = {
  username: string;
};

export const DangerZone: React.FC<DangerZoneProps> = (props) => {
  const { username } = props;

  const { t } = useTranslation();
  const router = useRouter();

  const [step, setStep] = React.useState<"closed" | "confirm" | "summary">("closed");
  const [summary, setSummary] = React.useState<null | AccountDeletionSummary>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [confirmInput, setConfirmInput] = React.useState("");
  const [deletePending, startDeleteTransition] = React.useTransition();

  const handleOpenDialog = () => {
    setSummaryLoading(true);
    setStep("summary");
    void fetchAccountDeletionSummary()
      .then((data) => {
        setSummary(data);
      })
      .finally(() => {
        setSummaryLoading(false);
      });
  };

  const handleProceedToConfirm = () => {
    setStep("confirm");
    setConfirmInput("");
  };

  const handleClose = () => {
    setStep("closed");
    setSummary(null);
    setConfirmInput("");
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteMyAccount();
      if (!result.success) {
        toast.error(t(result.error as TranslationKey));
        return;
      }
      handleClose();
      router.push("/sign-in");
    });
  };

  const handleConfirmInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmInput(e.target.value);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  const accountAge = summary != null ? formatAccountAge(summary.accountAge, t) : "";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("dangerZone")}</CardTitle>
          <CardDescription>{t("permanentlyDeleteYourAccountAndAllAssociatedData")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleOpenDialog} variant="tertiary">
            {t("deleteAccount")}
          </Button>
        </CardContent>
      </Card>

      <Dialog onOpenChange={handleDialogOpenChange} open={step !== "closed"}>
        <DialogContent>
          {step === "summary" && (
            <>
              <DialogHeader>
                <DialogTitle>{t("deleteAccount")}</DialogTitle>
                <DialogDescription>{t("thisActionCannotBeUndoneThisWillPermanentlyDelete")}</DialogDescription>
              </DialogHeader>

              {summaryLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="text-muted-foreground size-6 animate-spin" />
                </div>
              ) : (
                summary != null && (
                  <div className="space-y-2">
                    <SummaryRow label={t("links")} value={String(summary.linkCount)} />
                    <SummaryRow label={t("groups")} value={String(summary.groupCount)} />
                    <SummaryRow label={t("clicks")} value={String(summary.clickCount)} />
                    <SummaryRow label={t("webhooks")} value={String(summary.webhookCount)} />
                    {summary.isPro && <SummaryRow label={t("subscription")} value={t("pro")} />}
                    {summary.customDomain != null && (
                      <SummaryRow label={t("customDomain")} value={summary.customDomain} />
                    )}
                    <SummaryRow label={t("accountAge")} value={accountAge} />
                  </div>
                )
              )}

              <DialogFooter>
                <Button disabled={summaryLoading} onClick={handleProceedToConfirm} variant="tertiary">
                  {t("continue")}
                </Button>
                <Button onClick={handleClose} variant="secondary">
                  {t("cancel")}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle>{t("areYouAbsolutelySure")}</DialogTitle>
                <DialogDescription>{t("pleaseTypeYourUsername{{username}}ToConfirm", { username })}</DialogDescription>
              </DialogHeader>

              <Input
                autoComplete="off"
                disabled={deletePending}
                onChange={handleConfirmInputOnChange}
                placeholder={username}
                value={confirmInput}
              />

              <DialogFooter>
                <Button disabled={confirmInput !== username || deletePending} onClick={handleDelete} variant="tertiary">
                  {deletePending && <Loader2 className="size-3.5 animate-spin" />}
                  {t("permanentlyDeleteAccount")}
                </Button>
                <Button disabled={deletePending} onClick={handleClose} variant="secondary">
                  {t("cancel")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
