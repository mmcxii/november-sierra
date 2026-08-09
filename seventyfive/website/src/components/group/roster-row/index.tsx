"use client";

import type { ChallengeMode, MemberStatus } from "@/lib/challenge/tasks";
import type { TranslationKey } from "@/lib/i18n/i18next";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type RosterRowProps = {
  checkedCount: number;
  displayName: string;
  isSelf: boolean;
  mode: ChallengeMode;
  softStumble: boolean;
  status: MemberStatus;
  totalTasks: number;
};

export const RosterRow: React.FC<RosterRowProps> = (props) => {
  //* State
  const { t } = useTranslation();

  //* Variables
  const dayComplete = props.checkedCount >= props.totalTasks;
  let statusLabel: TranslationKey = dayComplete ? "complete" : "incomplete";
  if (props.status === "failed") {
    statusLabel = "failed";
  } else if (props.mode === "soft" && props.softStumble) {
    statusLabel = "offTrack";
  }

  let statusClass = "text-sf-muted";
  if (props.status === "failed") {
    statusClass = "text-sf-danger";
  } else if (props.softStumble) {
    statusClass = "text-sf-warn";
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3 text-sm">
      <div>
        <p className="font-medium">
          {props.displayName}
          {props.isSelf ? <span aria-hidden="true">{`\u00b7`}</span> : null}
        </p>
        <p className="text-sf-muted text-xs">{props.mode === "hard" ? t("hard") : t("soft")}</p>
      </div>
      <span className={statusClass}>{t(statusLabel)}</span>
    </li>
  );
};
