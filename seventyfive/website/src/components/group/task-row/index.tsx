"use client";

import type { TranslationKey } from "@/lib/i18n/i18next";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type TaskRowProps = {
  checked: boolean;
  disabled: boolean;
  labelKey: TranslationKey;
  taskId: string;
  onToggle: (taskId: string, nextChecked: boolean) => void;
};

export const TaskRow: React.FC<TaskRowProps> = (props) => {
  //* State
  const { t } = useTranslation();

  //* Handlers
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.onToggle(props.taskId, event.target.checked);
  };

  return (
    <li>
      <label className="flex items-center gap-3 text-sm">
        <input
          checked={props.checked}
          className="sf-check-pop size-5 accent-[var(--sf-accent)]"
          disabled={props.disabled}
          onChange={handleChange}
          type="checkbox"
        />
        <span>{t(props.labelKey)}</span>
      </label>
    </li>
  );
};
