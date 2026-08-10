"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { acknowledgePasswordSavedAction } from "@/lib/actions/account";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type PasswordRevealModalProps = {
  password: string;
  username: string;
};

export const PasswordRevealModal: React.FC<PasswordRevealModalProps> = (props) => {
  const { password, username } = props;

  //* State
  const { t } = useTranslation();
  const [ack, setAck] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(true);

  //* Handlers
  const copyPassword = () => {
    void navigator.clipboard.writeText(password);
    toast.success(t("loginPasswordCopied"));
  };

  const onContinue = () => {
    if (!ack) {
      return;
    }
    startTransition(async () => {
      await acknowledgePasswordSavedAction();
      setOpen(false);
    });
  };

  const handleAckChange = (checked: boolean | "indeterminate") => {
    setAck(checked === true);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="bg-sf-elevated text-sf-text w-full max-w-md space-y-4 rounded-[var(--sf-radius)] p-5 shadow-lg">
        <p className="font-sf-display text-xl">{t("saveYourLogin")}</p>
        <p className="text-sf-muted text-sm">{t("saveThisNowWeCanTShowYourPasswordAgain")}</p>
        <p className="font-mono text-sm">
          {t("username")}: {username}
        </p>
        <p className="font-mono text-sm break-all">
          {t("loginPassword")}: {password}
        </p>
        <button
          className="bg-sf-accent text-sf-accent-text w-full rounded-[var(--sf-radius)] px-3 py-2 text-sm"
          onClick={copyPassword}
          type="button"
        >
          {t("copyLoginPassword")}
        </button>
        <div className="flex items-center gap-2">
          <Checkbox checked={ack} id="migrationAck" onCheckedChange={handleAckChange} />
          <Label htmlFor="migrationAck">{t("iSavedMyPassword")}</Label>
        </div>
        <button
          className="border-sf-border w-full rounded-[var(--sf-radius)] border px-3 py-2 text-sm disabled:opacity-50"
          disabled={!ack || isPending}
          onClick={onContinue}
          type="button"
        >
          {t("continue")}
        </button>
      </div>
    </div>
  );
};
