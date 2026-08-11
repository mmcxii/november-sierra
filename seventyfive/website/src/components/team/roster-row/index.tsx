"use client";

import { TASK_ICONS } from "@/lib/challenge/task-icons";
import { tasksForMode, type ChallengeMode, type MemberStatus } from "@/lib/challenge/tasks";
import type { TranslationKey } from "@/lib/i18n/i18next";
import { cn } from "@/lib/utils";
import { Dumbbell } from "lucide-react";
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
  const tasks = tasksForMode(mode);
  const checked = new Set(checkedTaskIds);
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
        <ul aria-label={t("yourChecklist")} className="flex items-center gap-1.5">
          {tasks.map((task) => {
            const Icon = TASK_ICONS[task.id] ?? Dumbbell;
            const isChecked = checked.has(task.id);
            return (
              <li key={task.id}>
                <Icon
                  aria-hidden
                  className={cn("size-3.5", {
                    "sf-roster-icon-pulse": pulse,
                    "text-sf-accent": !pulse && isChecked,
                    "text-sf-muted/35": pulse || !isChecked,
                  })}
                  key={pulse ? `${task.id}-${pulseNonce}` : task.id}
                  strokeWidth={1.75}
                />
                <span className="sr-only">
                  {t(task.labelKey)}: {isChecked ? t("complete") : t("incomplete")}
                </span>
              </li>
            );
          })}
        </ul>
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
