"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";

export type HardFailModalProps = {
  disabled?: boolean;
  onExit: () => void;
  onFix: () => void;
  onMoveToSoft: () => void;
};

export const HardFailModal: React.FC<HardFailModalProps> = (props) => {
  const { disabled = false, onExit, onFix, onMoveToSoft } = props;

  //* State
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
    >
      <div
        aria-describedby="sf-hard-fail-modal-body"
        aria-labelledby="sf-hard-fail-modal-title"
        aria-modal="true"
        className="bg-sf-elevated text-sf-text w-full max-w-md space-y-4 rounded-[var(--sf-radius)] p-5 shadow-lg"
        role="dialog"
      >
        <p className="font-sf-display text-xl" id="sf-hard-fail-modal-title">
          {t("yesterdayIsntComplete")}
        </p>
        <p className="text-sf-muted text-sm" id="sf-hard-fail-modal-body">
          {t("aHardDayIsMissingChecks")}
        </p>
        <div className="space-y-2">
          <button
            className="bg-sf-accent text-sf-accent-text w-full rounded-[var(--sf-radius)] px-3 py-2 text-sm disabled:opacity-60"
            disabled={disabled}
            onClick={onFix}
            type="button"
          >
            {t("iStillHaveChecksToLog")}
          </button>
          <button
            className="border-sf-border w-full rounded-[var(--sf-radius)] border px-3 py-2 text-sm disabled:opacity-60"
            disabled={disabled}
            onClick={onMoveToSoft}
            type="button"
          >
            {t("moveToSoft")}
          </button>
          <button
            className="border-sf-danger/40 text-sf-danger w-full rounded-[var(--sf-radius)] border px-3 py-2 text-sm disabled:opacity-60"
            disabled={disabled}
            onClick={onExit}
            type="button"
          >
            {t("failAndExitTheChallenge")}
          </button>
        </div>
      </div>
    </div>
  );
};
