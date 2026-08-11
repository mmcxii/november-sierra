"use client";

import { ChallengeProgress } from "@/components/challenge/challenge-progress";
import { BoardActionsMenu } from "@/components/team/board/board-actions-menu";
import { DateStepper } from "@/components/team/date-stepper";
import { RosterRow } from "@/components/team/roster-row";
import { TaskRow } from "@/components/team/task-row";
import { Container } from "@/components/ui/container";
import { setTaskCheckedAction } from "@/lib/actions/tasks";
import { leaveTeamAction } from "@/lib/actions/team";
import {
  canEditDay,
  daysUntilStart,
  preStartRosterPulseMs,
  tasksForMode,
  type ChallengeMode,
  type MemberStatus,
} from "@/lib/challenge/tasks";
import type { TranslationKey } from "@/lib/i18n/i18next";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type RosterMember = {
  checkedTaskIds: readonly string[];
  displayName: string;
  id: string;
  mode: ChallengeMode;
  softStumble: boolean;
  status: MemberStatus;
};

export type TeamBoardProps = {
  checkedTaskIds: string[];
  endDate: string;
  inviteCode: string;
  isOwner: boolean;
  memberId: string;
  memberMode: ChallengeMode;
  memberStatus: MemberStatus;
  progressElapsedComplete: readonly boolean[];
  progressLastElapsedIsToday: boolean;
  roster: RosterMember[];
  selectedDate: string;
  startDate: string;
  teamId: string;
  teamName: string;
  todayLocal: string;
};

export const TeamBoard: React.FC<TeamBoardProps> = (props) => {
  const {
    checkedTaskIds,
    endDate,
    inviteCode,
    isOwner,
    memberId,
    memberMode,
    memberStatus,
    progressElapsedComplete,
    progressLastElapsedIsToday,
    roster,
    selectedDate,
    startDate,
    teamId,
    teamName,
    todayLocal,
  } = props;

  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [isRefreshing, startRefreshTransition] = React.useTransition();
  const [showInvite, setShowInvite] = React.useState(false);
  const [error, setError] = React.useState<null | TranslationKey>(null);
  const [rosterPulseNonce, setRosterPulseNonce] = React.useState(0);

  //* Variables
  const editable = canEditDay({
    mode: memberMode,
    selectedDate,
    startDate,
    status: memberStatus,
    todayLocal,
  });
  const tasks = tasksForMode(memberMode);
  const checked = new Set(checkedTaskIds);
  const daysUntil = daysUntilStart(startDate, todayLocal);
  const rosterPulseIntervalMs = preStartRosterPulseMs(daysUntil);
  const dayNumber =
    Math.floor((Date.parse(`${selectedDate}T00:00:00.000Z`) - Date.parse(`${startDate}T00:00:00.000Z`)) / 86_400_000) +
    1;
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?code=${encodeURIComponent(inviteCode)}`
      : `/join?code=${encodeURIComponent(inviteCode)}`;

  //* Handlers
  const onToggle = (taskId: string, nextChecked: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await setTaskCheckedAction({
        checked: nextChecked,
        date: selectedDate,
        taskId,
        teamId,
      });
      if ("error" in result) {
        setError(result.error ?? "somethingWentWrong");
        return;
      }
      router.refresh();
    });
  };

  const toggleInvite = () => {
    setShowInvite((value) => {
      return !value;
    });
  };

  const copyPassword = () => {
    void navigator.clipboard.writeText(inviteCode);
    toast.success(t("teamInvitePasswordCopied"));
  };

  const copyJoinLink = () => {
    void navigator.clipboard.writeText(joinUrl);
    toast.success(t("joinLinkCopied"));
  };

  const onDateChange = (nextDate: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("date", nextDate);
    router.push(`/teams/${teamId}?${params.toString()}`);
  };

  const onRefreshRoster = () => {
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  const onLeave = () => {
    startTransition(async () => {
      await leaveTeamAction(teamId);
    });
  };

  //* Effects
  React.useEffect(() => {
    if (rosterPulseIntervalMs == null) {
      return;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const intervalMs = reducedMotion ? 30_000 : rosterPulseIntervalMs;
    setRosterPulseNonce((nonce) => {
      return nonce + 1;
    });
    const timer = window.setInterval(() => {
      setRosterPulseNonce((nonce) => {
        return nonce + 1;
      });
    }, intervalMs);
    return () => {
      window.clearInterval(timer);
    };
  }, [rosterPulseIntervalMs]);

  return (
    <Container as="main" className="flex-1 overflow-x-hidden py-8">
      <header>
        <p className="font-sf-display text-3xl tracking-tight break-words">{teamName}</p>
        <ChallengeProgress
          actions={<BoardActionsMenu onInvite={toggleInvite} teamId={teamId} />}
          className="mt-1"
          daysUntilStart={daysUntil}
          elapsedComplete={progressElapsedComplete}
          lastElapsedIsToday={progressLastElapsedIsToday}
          memberMode={memberMode}
          memberStatus={memberStatus}
          selectedDayNumber={dayNumber}
        />
      </header>

      {showInvite ? (
        <section className="sf-rise border-sf-border bg-sf-elevated mt-6 space-y-3 rounded-[var(--sf-radius)] border p-4">
          <p className="text-sf-muted text-sm">
            {t("shareThisPasswordWithYourTeamAnyoneWithItCanJoinBeforeTheStartDate")}
          </p>
          <code className="block text-xs break-all">{inviteCode}</code>
          <div className="flex flex-col gap-2">
            <button
              className="bg-sf-accent text-sf-accent-text rounded-[var(--sf-radius)] px-3 py-2 text-sm"
              onClick={copyPassword}
              type="button"
            >
              {t("copyTeamInvitePassword")}
            </button>
            <button
              className="border-sf-border rounded-[var(--sf-radius)] border px-3 py-2 text-sm"
              onClick={copyJoinLink}
              type="button"
            >
              {t("copyJoinLink")}
            </button>
          </div>
        </section>
      ) : null}

      <div className="mt-8">
        <DateStepper
          endDate={endDate}
          onDateChange={onDateChange}
          selectedDate={selectedDate}
          startDate={startDate}
          todayLocal={todayLocal}
        />
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sf-muted text-xs font-medium tracking-[0.14em] uppercase">{t("yourTeam")}</h2>
          <button
            aria-label={t("refreshTeam")}
            className="text-sf-muted hover:text-sf-text rounded-[var(--sf-radius)] p-1 disabled:opacity-60"
            disabled={isRefreshing}
            onClick={onRefreshRoster}
            type="button"
          >
            <RefreshCw aria-hidden className={cn("size-3.5", { "animate-spin": isRefreshing })} strokeWidth={1.75} />
          </button>
        </div>
        <ul className="divide-sf-border mt-3 divide-y">
          {roster.map((member) => {
            return (
              <RosterRow
                checkedTaskIds={member.checkedTaskIds}
                displayName={member.displayName}
                isSelf={member.id === memberId}
                key={member.id}
                mode={member.mode}
                pulse={rosterPulseIntervalMs != null}
                pulseNonce={rosterPulseNonce}
                softStumble={member.softStumble}
                status={member.status}
              />
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sf-muted text-xs font-medium tracking-[0.14em] uppercase">{t("yourChecklist")}</h2>
        {memberStatus === "failed" && selectedDate === todayLocal ? (
          <p className="text-sf-danger mt-3 text-sm">{t("fixPastDaysToContinue")}</p>
        ) : null}
        <ul className="mt-4 space-y-3">
          {tasks.map((task) => {
            return (
              <TaskRow
                checked={checked.has(task.id)}
                disabled={!editable || isPending}
                key={task.id}
                labelKey={task.labelKey}
                onToggle={onToggle}
                taskId={task.id}
              />
            );
          })}
        </ul>
      </section>

      {error != null ? <p className="text-sf-danger mt-4 text-sm">{t(error)}</p> : null}

      {!isOwner ? (
        <button className="text-sf-muted mt-12 text-sm underline" onClick={onLeave} type="button">
          {t("leaveTeam")}
        </button>
      ) : null}
    </Container>
  );
};
