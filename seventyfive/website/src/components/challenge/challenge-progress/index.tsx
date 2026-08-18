"use client";

import { SLICE_CLASS, emberDay, emberLevel, emberProgress } from "@/components/challenge/challenge-progress/utils";
import {
  buildChallengeProgressSlices,
  CHALLENGE_DAY_COUNT,
  countMissedSlices,
  type ChallengeProgressSlice,
} from "@/lib/challenge/progress";
import type { ChallengeMode, MemberStatus } from "@/lib/challenge/tasks";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type ChallengeProgressProps = {
  actions?: React.ReactNode;
  celebration?: null | "day" | "finale";
  celebrationNonce?: number;
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
    celebration = null,
    celebrationNonce = 0,
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

  const elapsedDayCount = isPreStart ? 0 : Math.min(elapsedComplete.length, CHALLENGE_DAY_COUNT);
  const progress = emberProgress(elapsedDayCount);
  const level = emberLevel(isPreStart ? 0 : progress);
  const day = emberDay(elapsedDayCount, isPreStart);
  const emberFailed = memberMode === "hard" && (memberStatus === "failed" || memberStatus === "exited");

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sf-muted min-w-0 flex-1 text-sm">{label}</p>
        {actions}
      </div>
      <div className="relative mt-2 w-full pt-1 pb-1">
        <div
          aria-label={barLabel}
          className="bg-sf-border/50 flex h-1.5 w-full overflow-hidden rounded-full"
          role="img"
        >
          {daySlices.map((daySlice) => {
            return <span className={cn("min-w-0 flex-1", SLICE_CLASS[daySlice.slice])} key={daySlice.day} />;
          })}
        </div>
        <span
          aria-hidden
          className={cn("sf-progress-ember absolute top-1/2 -translate-x-1/2 -translate-y-1/2", {
            "opacity-70": isPreStart,
            "sf-progress-ember-bloom": celebration === "day",
            "sf-progress-ember-failed": emberFailed,
            "sf-progress-ember-finale": celebration === "finale",
          })}
          data-day={day}
          data-level={level}
          key={celebrationNonce > 0 ? `ember-${celebrationNonce}` : "ember"}
        />
      </div>
    </div>
  );
};
