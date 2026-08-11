"use client";

import { SLICE_CLASS } from "@/components/challenge/challenge-progress/utils";
import { buildChallengeProgressSlices, countMissedSlices, type ChallengeProgressSlice } from "@/lib/challenge/progress";
import type { ChallengeMode, MemberStatus } from "@/lib/challenge/tasks";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type ChallengeProgressProps = {
  actions?: React.ReactNode;
  className?: string;
  daysUntilStart: number;
  elapsedComplete: readonly boolean[];
  lastElapsedIsToday: boolean;
  memberMode: ChallengeMode;
  memberStatus: MemberStatus;
  selectedDayNumber: number;
};

export const ChallengeProgress: React.FC<ChallengeProgressProps> = (props) => {
  const {
    actions,
    className,
    daysUntilStart,
    elapsedComplete,
    lastElapsedIsToday,
    memberMode,
    memberStatus,
    selectedDayNumber,
  } = props;

  //* State
  const { t } = useTranslation();

  //* Variables
  const isPreStart = daysUntilStart > 0;
  let label = t("challengeStartsIn{{count}}Days", { count: daysUntilStart });
  if (daysUntilStart === 0) {
    label = t("day{{day}}Of75", { day: selectedDayNumber });
  } else if (daysUntilStart === 1) {
    label = t("challengeStartsTomorrow");
  }

  const slices: readonly ChallengeProgressSlice[] = isPreStart
    ? buildChallengeProgressSlices({
        elapsedComplete: [],
        lastElapsedIsToday: false,
        mode: memberMode,
        status: memberStatus,
      })
    : buildChallengeProgressSlices({
        elapsedComplete,
        lastElapsedIsToday,
        mode: memberMode,
        status: memberStatus,
      });

  const missedCount = countMissedSlices(slices);
  let barLabel = label;
  if (!isPreStart && memberMode === "soft" && missedCount > 0) {
    barLabel = t("day{{day}}Of75{{count}}DaysMissed", {
      count: missedCount,
      day: selectedDayNumber,
    });
  }
  const daySlices = slices.map((slice, index) => {
    return { day: index + 1, slice };
  });

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sf-muted min-w-0 flex-1 text-sm">{label}</p>
        {actions}
      </div>
      <div
        aria-label={barLabel}
        className="bg-sf-border/50 mt-2 flex h-1.5 w-full overflow-hidden rounded-full"
        role="img"
      >
        {daySlices.map((daySlice) => {
          return <span className={cn("min-w-0 flex-1", SLICE_CLASS[daySlice.slice])} key={daySlice.day} />;
        })}
      </div>
    </div>
  );
};
