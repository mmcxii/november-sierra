"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  const { checked, disabled, labelKey, onToggle, taskId } = props;

  //* State
  const { t } = useTranslation();

  //* Handlers
  const handleCheckedChange = (next: boolean | "indeterminate") => {
    onToggle(taskId, next === true);
  };

  return (
    <li>
      <div className="flex items-center gap-3 text-sm">
        <Checkbox
          checked={checked}
          className="sf-check-pop size-5"
          disabled={disabled}
          id={`task-${taskId}`}
          onCheckedChange={handleCheckedChange}
        />
        <Label className="text-sf-text cursor-pointer font-normal" htmlFor={`task-${taskId}`}>
          {t(labelKey)}
        </Label>
      </div>
    </li>
  );
};
