"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { TranslationKey } from "@/lib/i18n/i18next";
import { cn } from "@/lib/utils";
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
  const [flash, setFlash] = React.useState(false);

  //* Refs
  const flashTimerRef = React.useRef<null | number>(null);

  //* Handlers
  const handleCheckedChange = (next: boolean | "indeterminate") => {
    const nextChecked = next === true;
    if (nextChecked) {
      if (flashTimerRef.current != null) {
        window.clearTimeout(flashTimerRef.current);
      }
      setFlash(true);
      flashTimerRef.current = window.setTimeout(() => {
        setFlash(false);
        flashTimerRef.current = null;
      }, 420);
    }
    onToggle(taskId, nextChecked);
  };

  //* Effects
  React.useEffect(() => {
    return () => {
      if (flashTimerRef.current != null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  return (
    <li>
      <div className={cn("flex items-center gap-3 px-1 py-0.5 text-sm", { "sf-task-flash": flash })}>
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
