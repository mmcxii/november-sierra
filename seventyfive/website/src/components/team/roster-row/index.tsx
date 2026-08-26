"use client";

import { TaskIconStrip } from "@/components/team/task-icon-strip";
import { isDayComplete, type ChallengeMode, type MemberStatus } from "@/lib/challenge/tasks";
import type { TranslationKey } from "@/lib/i18n/i18next";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { rosterStatusLabel } from "./utils";

export type RosterRowProps = {
  checkedTaskIds: readonly string[];
  displayName: string;
  endDate: string;
  hardCompletedDays?: null | number;
  isSelf: boolean;
  mode: ChallengeMode;
  progressPhotoEndsOnly?: boolean;
  /** When true, icons run a quick unchecked↔checked fade on each pulseNonce. */
  pulse?: boolean;
  /** Bumps to restart the synced one-shot pulse animation. */
  pulseNonce?: number;
  selectedDate: string;
  softStumble: boolean;
  startDate: string;
  status: MemberStatus;
};

export const RosterRow: React.FC<RosterRowProps> = (props) => {
  const {
    checkedTaskIds,
    displayName,
    endDate,
    hardCompletedDays = null,
    isSelf,
    mode,
    progressPhotoEndsOnly = false,
    pulse = false,
    pulseNonce = 0,
    selectedDate,
    softStumble,
    startDate,
    status,
  } = props;

  //* State
  const { t } = useTranslation();

  //* Variables
  const dayComplete = isDayComplete(mode, checkedTaskIds, {
    date: selectedDate,
    endDate,
    progressPhotoEndsOnly,
    startDate,
  });
  const statusLabel = rosterStatusLabel({
    dayComplete,
    mode,
    softStumble,
    status,
  });
  const modeLabel = mode === "hard" ? t("hard") : t("soft");
  let hardDaysKey: null | TranslationKey = null;
  if (mode === "soft" && hardCompletedDays != null) {
    hardDaysKey = hardCompletedDays === 1 ? "{{count}}DayOnHard" : "{{count}}DaysOnHard";
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium">
          {displayName}
          {isSelf ? <span aria-hidden="true">{`\u00b7`}</span> : null}
        </p>
        <p className="text-sf-muted text-xs">
          {modeLabel}
          {hardDaysKey != null && hardCompletedDays != null ? (
            <>
              <span aria-hidden="true">{` \u00b7 `}</span>
              <span className="tabular-nums">{t(hardDaysKey, { count: hardCompletedDays })}</span>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <TaskIconStrip
          checkedTaskIds={checkedTaskIds}
          date={selectedDate}
          endDate={endDate}
          mode={mode}
          progressPhotoEndsOnly={progressPhotoEndsOnly}
          pulse={pulse}
          pulseNonce={pulseNonce}
          startDate={startDate}
        />
        {statusLabel != null ? (
          <span
            className={cn("text-xs", {
              "text-sf-danger": status === "failed" || status === "exited",
              "text-sf-muted": status !== "failed" && status !== "exited" && !softStumble,
              "text-sf-warn": status !== "failed" && status !== "exited" && softStumble,
            })}
          >
            {t(statusLabel)}
          </span>
        ) : null}
      </div>
    </li>
  );
};
