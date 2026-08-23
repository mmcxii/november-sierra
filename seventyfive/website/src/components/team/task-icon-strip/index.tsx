"use client";

import { TASK_ICONS } from "@/lib/challenge/task-icons";
import { tasksForDay, type ChallengeMode } from "@/lib/challenge/tasks";
import { cn } from "@/lib/utils";
import { Dumbbell } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type TaskIconStripProps = {
  checkedTaskIds: readonly string[];
  className?: string;
  date?: string;
  endDate?: string;
  mode: ChallengeMode;
  progressPhotoEndsOnly?: boolean;
  /** When true, icons run a quick unchecked↔checked fade on each pulseNonce. */
  pulse?: boolean;
  /** Bumps to restart the synced one-shot pulse animation. */
  pulseNonce?: number;
  startDate?: string;
};

export const TaskIconStrip: React.FC<TaskIconStripProps> = (props) => {
  const {
    checkedTaskIds,
    className,
    date,
    endDate,
    mode,
    progressPhotoEndsOnly,
    pulse = false,
    pulseNonce = 0,
    startDate,
  } = props;

  //* State
  const { t } = useTranslation();

  //* Variables
  const tasks = tasksForDay(
    mode,
    date != null && endDate != null && startDate != null
      ? { date, endDate, progressPhotoEndsOnly, startDate }
      : undefined,
  );
  const checked = new Set(checkedTaskIds);

  return (
    <ul aria-label={t("yourChecklist")} className={cn("flex items-center gap-1.5", className)}>
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
  );
};
