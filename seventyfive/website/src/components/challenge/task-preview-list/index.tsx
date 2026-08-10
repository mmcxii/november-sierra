"use client";

import { TASK_ICONS } from "@/lib/challenge/task-icons";
import { tasksForMode, type ChallengeMode } from "@/lib/challenge/tasks";
import { Dumbbell } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type TaskPreviewListProps = {
  mode: ChallengeMode;
};

export const TaskPreviewList: React.FC<TaskPreviewListProps> = (props) => {
  const { mode } = props;

  //* State
  const { t } = useTranslation();

  //* Variables
  const tasks = tasksForMode(mode);

  return (
    <ul className="text-sf-muted space-y-2 pt-1 text-sm">
      {tasks.map((task) => {
        const Icon = TASK_ICONS[task.id] ?? Dumbbell;
        return (
          <li className="flex items-center gap-2.5" key={task.id}>
            <Icon aria-hidden className="text-sf-accent size-3.5 shrink-0" strokeWidth={1.75} />
            <span>{t(task.labelKey)}</span>
          </li>
        );
      })}
    </ul>
  );
};
