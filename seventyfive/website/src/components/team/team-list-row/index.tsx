"use client";

import { TaskIconStrip } from "@/components/team/task-icon-strip";
import type { ChallengeMode } from "@/lib/challenge/tasks";
import Link from "next/link";
import * as React from "react";

export type TeamListRowProps = {
  checkedTaskIds: readonly string[];
  date: string;
  endDate: string;
  mode: ChallengeMode;
  progressLabel: string;
  progressPhotoEndsOnly: boolean;
  startDate: string;
  teamId: string;
  teamName: string;
};

export const TeamListRow: React.FC<TeamListRowProps> = (props) => {
  const { checkedTaskIds, date, endDate, mode, progressLabel, progressPhotoEndsOnly, startDate, teamId, teamName } =
    props;

  return (
    <li>
      <Link className="flex items-center justify-between gap-3 py-4" href={`/teams/${teamId}`}>
        <div className="min-w-0">
          <p className="truncate text-lg font-medium">{teamName}</p>
          <p className="text-sf-muted mt-0.5 text-xs">{progressLabel}</p>
        </div>
        <TaskIconStrip
          checkedTaskIds={checkedTaskIds}
          className="shrink-0"
          date={date}
          endDate={endDate}
          mode={mode}
          progressPhotoEndsOnly={progressPhotoEndsOnly}
          startDate={startDate}
        />
      </Link>
    </li>
  );
};
