"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type InviteModalProps = {
  inviteCode: string;
  joinUrl: string;
  onClose: () => void;
};

export const InviteModal: React.FC<InviteModalProps> = (props) => {
  const { inviteCode, joinUrl, onClose } = props;

  //* State
  const { t } = useTranslation();

  //* Handlers
  const copyJoinLink = () => {
    void navigator.clipboard.writeText(joinUrl);
    toast.success(t("joinLinkCopied"));
  };

  const copyPassword = () => {
    void navigator.clipboard.writeText(inviteCode);
    toast.success(t("teamInvitePasswordCopied"));
  };

  const onBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onBackdropClick}
      role="presentation"
    >
      <div
        aria-labelledby="sf-invite-modal-title"
        aria-modal="true"
        className="bg-sf-elevated text-sf-text w-full max-w-md space-y-4 rounded-[var(--sf-radius)] p-5 shadow-lg"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-sf-display text-xl" id="sf-invite-modal-title">
            {t("invite")}
          </p>
          <button
            className="text-sf-muted hover:text-sf-text shrink-0 text-sm underline-offset-2 hover:underline"
            onClick={onClose}
            type="button"
          >
            {t("close")}
          </button>
        </div>
        <p className="text-sf-muted text-sm">{t("shareThisLinkWithYourTeamAnyoneWithItCanJoinThroughTheFirstDay")}</p>
        <button
          className="bg-sf-accent text-sf-accent-text w-full rounded-[var(--sf-radius)] px-3 py-2 text-sm"
          onClick={copyJoinLink}
          type="button"
        >
          {t("copyJoinLink")}
        </button>
        <div className="space-y-2">
          <code className="text-sf-muted block text-xs break-all">{inviteCode}</code>
          <button
            className="border-sf-border w-full rounded-[var(--sf-radius)] border px-3 py-2 text-sm"
            onClick={copyPassword}
            type="button"
          >
            {t("copyTeamInvitePassword")}
          </button>
        </div>
      </div>
    </div>
  );
};
