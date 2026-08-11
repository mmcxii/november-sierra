"use client";

import { TaskIconStrip } from "@/components/team/task-icon-strip";
import { type ChallengeMode, type MemberStatus } from "@/lib/challenge/tasks";
import type { TranslationKey } from "@/lib/i18n/i18next";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type RosterRowProps = {
  checkedTaskIds: readonly string[];
  displayName: string;
  isSelf: boolean;
  mode: ChallengeMode;
  /** When true, icons run a quick unchecked↔checked fade on each pulseNonce. */
  pulse?: boolean;
  /** Bumps to restart the synced one-shot pulse animation. */
  pulseNonce?: number;
  softStumble: boolean;
  status: MemberStatus;
};

export const RosterRow: React.FC<RosterRowProps> = (props) => {
  const { checkedTaskIds, displayName, isSelf, mode, pulse = false, pulseNonce = 0, softStumble, status } = props;

  //* State
  const { t } = useTranslation();

  //* Variables
  let statusLabel: null | TranslationKey = null;
  if (status === "failed") {
    statusLabel = "failed";
  } else if (mode === "soft" && softStumble) {
    statusLabel = "offTrack";
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium">
          {displayName}
          {isSelf ? <span aria-hidden="true">{`\u00b7`}</span> : null}
        </p>
        <p className="text-sf-muted text-xs">{mode === "hard" ? t("hard") : t("soft")}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <TaskIconStrip checkedTaskIds={checkedTaskIds} mode={mode} pulse={pulse} pulseNonce={pulseNonce} />
        {statusLabel != null ? (
          <span
            className={cn("text-xs", {
              "text-sf-danger": status === "failed",
              "text-sf-muted": status !== "failed" && !softStumble,
              "text-sf-warn": status !== "failed" && softStumble,
            })}
          >
            {t(statusLabel)}
          </span>
        ) : null}
      </div>
    </li>
  );
};
