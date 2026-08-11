"use client";

import { addDaysDateOnly } from "@/lib/challenge/tasks";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { canStepDate, formatStepperDateLabel, stepperMaxDate } from "./utils";

export type DateStepperProps = {
  endDate: string;
  selectedDate: string;
  startDate: string;
  todayLocal: string;
  onDateChange: (date: string) => void;
};

export const DateStepper: React.FC<DateStepperProps> = (props) => {
  const { endDate, onDateChange, selectedDate, startDate, todayLocal } = props;

  //* State
  const { t } = useTranslation();

  //* Refs
  const pickerRef = React.useRef<HTMLInputElement>(null);

  //* Variables
  const maxDate = stepperMaxDate(todayLocal, endDate);
  const canGoBack = canStepDate({
    direction: -1,
    endDate,
    selectedDate,
    startDate,
    todayLocal,
  });
  const canGoForward = canStepDate({
    direction: 1,
    endDate,
    selectedDate,
    startDate,
    todayLocal,
  });
  const label = formatStepperDateLabel(selectedDate);

  //* Handlers
  const step = (direction: -1 | 1) => {
    if (!canStepDate({ direction, endDate, selectedDate, startDate, todayLocal })) {
      return;
    }
    onDateChange(addDaysDateOnly(selectedDate, direction));
  };

  const openPicker = () => {
    const input = pickerRef.current;
    if (input == null) {
      return;
    }
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  };

  const handlePickerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (next === "") {
      return;
    }
    onDateChange(next);
  };

  const goBack = () => {
    step(-1);
  };

  const goForward = () => {
    step(1);
  };

  return (
    <div className="relative w-full min-w-0">
      <div className="bg-sf-elevated/80 flex w-full min-w-0 items-center rounded-full p-1">
        <button
          aria-label={t("previousDay")}
          className={cn(
            "text-sf-text flex size-10 shrink-0 items-center justify-center rounded-full transition-opacity",
            { "opacity-30": !canGoBack },
          )}
          disabled={!canGoBack}
          onClick={goBack}
          type="button"
        >
          <ChevronLeft aria-hidden className="size-5" strokeWidth={2.25} />
        </button>

        <button
          aria-label={t("selectDate")}
          className="bg-sf-bg text-sf-text min-w-0 flex-1 truncate rounded-full px-3 py-2.5 text-center text-sm font-semibold tracking-[0.08em] uppercase"
          onClick={openPicker}
          type="button"
        >
          {label}
        </button>

        <button
          aria-label={t("nextDay")}
          className={cn(
            "text-sf-text flex size-10 shrink-0 items-center justify-center rounded-full transition-opacity",
            { "opacity-30": !canGoForward },
          )}
          disabled={!canGoForward}
          onClick={goForward}
          type="button"
        >
          <ChevronRight aria-hidden className="size-5" strokeWidth={2.25} />
        </button>
      </div>

      {/* Keep out of the flex row: global input { width:100% } would overflow the stepper. */}
      <input
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 h-px !w-px max-w-px opacity-0"
        max={maxDate}
        min={startDate}
        onChange={handlePickerChange}
        ref={pickerRef}
        tabIndex={-1}
        type="date"
        value={selectedDate}
      />
    </div>
  );
};
