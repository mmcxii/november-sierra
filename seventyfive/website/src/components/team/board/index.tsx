"use client";

import { ChallengeProgress } from "@/components/challenge/challenge-progress";
import { usePendingRouter } from "@/components/navigation-pending";
import { BoardActionsMenu } from "@/components/team/board/board-actions-menu";
import { DayQuote, type DayQuoteProps } from "@/components/team/board/day-quote";
import { HardFailModal } from "@/components/team/board/hard-fail-modal";
import { InviteModal } from "@/components/team/board/invite-modal";
import { DateStepper } from "@/components/team/date-stepper";
import { RosterRow } from "@/components/team/roster-row";
import { TaskRow } from "@/components/team/task-row";
import { Container } from "@/components/ui/container";
import { resolveHardFailAction } from "@/lib/actions/member";
import { setTaskCheckedAction } from "@/lib/actions/tasks";
import { leaveTeamAction } from "@/lib/actions/team";
import {
  challengeDayNumber,
  dayCelebratedStorageKey,
  daysRemainingAfter,
  resolveCheckCelebration,
  teamCelebratedStorageKey,
  type CheckCelebration,
} from "@/lib/challenge/celebrations";
import {
  canEditDay,
  daysUntilStart,
  isJoinAllowed,
  preStartRosterPulseMs,
  tasksForDay,
  type ChallengeMode,
  type MemberStatus,
} from "@/lib/challenge/tasks";
import { teamCelebrationIsFinale } from "@/lib/challenge/team-day";
import type { TranslationKey } from "@/lib/i18n/i18next";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { scrollWindowToTop } from "./utils";

export type RosterMember = {
  checkedTaskIds: readonly string[];
  displayName: string;
  hardCompletedDays: null | number;
  id: string;
  mode: ChallengeMode;
  progressPhotoEndsOnly: boolean;
  softStumble: boolean;
  status: MemberStatus;
};

export type TeamBoardProps = {
  checkedTaskIds: string[];
  dayQuote: null | DayQuoteProps;
  endDate: string;
  firstIncompletePastDate: null | string;
  inviteCode: string;
  isOwner: boolean;
  memberId: string;
  memberMode: ChallengeMode;
  memberStatus: MemberStatus;
  pendingTeamCelebrationDate: null | string;
  progressElapsedComplete: readonly boolean[];
  progressLastElapsedIsToday: boolean;
  progressPhotoEndsOnly: boolean;
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
    dayQuote,
    endDate,
    firstIncompletePastDate,
    inviteCode,
    isOwner,
    memberId,
    memberMode,
    memberStatus,
    pendingTeamCelebrationDate,
    progressElapsedComplete,
    progressLastElapsedIsToday,
    progressPhotoEndsOnly,
    roster,
    selectedDate,
    startDate,
    teamId,
    teamName,
    todayLocal,
  } = props;

  //* State
  const { t } = useTranslation();
  const router = usePendingRouter();
  const [isPending, startTransition] = React.useTransition();
  const [isRefreshing, startRefreshTransition] = React.useTransition();
  const [showInvite, setShowInvite] = React.useState(false);
  const [error, setError] = React.useState<null | TranslationKey>(null);
  const [rosterPulseNonce, setRosterPulseNonce] = React.useState(0);
  const [celebration, setCelebration] = React.useState<null | Exclude<CheckCelebration, "none">>(null);
  const [celebrationNonce, setCelebrationNonce] = React.useState(0);

  //* Refs
  const pendingTeamPlayedRef = React.useRef<null | string>(null);

  //* Variables
  const editable = canEditDay({
    mode: memberMode,
    selectedDate,
    startDate,
    status: memberStatus,
    todayLocal,
  });
  const tasks = tasksForDay(memberMode, {
    date: selectedDate,
    endDate,
    progressPhotoEndsOnly,
    startDate,
  });
  const checked = new Set(checkedTaskIds);
  const daysUntil = daysUntilStart(startDate, todayLocal);
  const inviteAvailable = isJoinAllowed(startDate, todayLocal);
  const rosterPulseIntervalMs = preStartRosterPulseMs(daysUntil);
  const dayNumber = challengeDayNumber(startDate, selectedDate) ?? 1;
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?code=${encodeURIComponent(inviteCode)}`
      : `/join?code=${encodeURIComponent(inviteCode)}`;

  //* Handlers
  const playCelebration = React.useCallback((kind: Exclude<CheckCelebration, "none">) => {
    setCelebration(kind);
    setCelebrationNonce((nonce) => {
      return nonce + 1;
    });
  }, []);

  const celebrateTeam = React.useCallback(
    (date: string) => {
      const storageKey = teamCelebratedStorageKey(teamId, date);
      try {
        if (sessionStorage.getItem(storageKey) != null) {
          return;
        }
        sessionStorage.setItem(storageKey, "team");
      } catch {
        // Private mode / disabled storage — still celebrate once this render path.
      }

      const day = challengeDayNumber(startDate, date);
      const isFinale = teamCelebrationIsFinale(startDate, endDate, date);
      playCelebration(isFinale ? "finale" : "team");
      if (isFinale) {
        toast.success(t("theTeamFinishedTheChallenge"));
        return;
      }
      if (day == null) {
        return;
      }
      toast.success(t("theTeamFinishedDay{{day}}", { day }));
    },
    [endDate, playCelebration, startDate, t, teamId],
  );

  const celebrateDay = (kind: Exclude<CheckCelebration, "none">) => {
    const storageKey = dayCelebratedStorageKey(teamId, todayLocal);
    try {
      if (sessionStorage.getItem(storageKey) != null) {
        return;
      }
      sessionStorage.setItem(storageKey, kind);
    } catch {
      // Private mode / disabled storage — still celebrate once this render path.
    }

    playCelebration(kind);

    const todayDay = challengeDayNumber(startDate, todayLocal);
    if (kind === "finale") {
      toast.success(t("challengeCompletedCongratulations"));
      return;
    }
    if (todayDay == null) {
      return;
    }
    toast.success(
      t("day{{day}}Complete{{count}}MoreToGo", {
        count: daysRemainingAfter(todayDay),
        day: todayDay,
      }),
    );
  };

  const onToggle = (taskId: string, nextChecked: boolean) => {
    setError(null);
    const celebrationKind = resolveCheckCelebration({
      checkedTaskIdsBefore: checkedTaskIds,
      endDate,
      mode: memberMode,
      nextChecked,
      progressPhotoEndsOnly,
      selectedDate,
      startDate,
      taskId,
      todayLocal,
    });

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
      const shouldCelebrate = result.teamCelebration || celebrationKind !== "none";
      if (shouldCelebrate) {
        await scrollWindowToTop();
      }
      if (result.teamCelebration) {
        celebrateTeam(selectedDate);
      } else if (celebrationKind !== "none") {
        celebrateDay(celebrationKind);
      }
      router.refresh();
    });
  };

  const openInvite = () => {
    setShowInvite(true);
  };

  const closeInvite = () => {
    setShowInvite(false);
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

  const resolveHardFail = (choice: "exit" | "fix" | "soft") => {
    startTransition(async () => {
      const result = await resolveHardFailAction({ choice, teamId });
      if ("error" in result) {
        setError(result.error ?? "somethingWentWrong");
        return;
      }
      if (choice === "fix") {
        const nextDate = result.incompleteDate ?? firstIncompletePastDate;
        if (nextDate != null) {
          const params = new URLSearchParams(window.location.search);
          params.set("date", nextDate);
          router.push(`/teams/${teamId}?${params.toString()}`);
          return;
        }
      }
      router.refresh();
    });
  };

  const onFixHardFail = () => {
    resolveHardFail("fix");
  };

  const onMoveToSoft = () => {
    resolveHardFail("soft");
  };

  const onExitChallenge = () => {
    resolveHardFail("exit");
  };

  //* Effects
  React.useEffect(() => {
    if (pendingTeamCelebrationDate == null) {
      return;
    }
    if (pendingTeamPlayedRef.current === pendingTeamCelebrationDate) {
      return;
    }
    pendingTeamPlayedRef.current = pendingTeamCelebrationDate;
    celebrateTeam(pendingTeamCelebrationDate);
  }, [celebrateTeam, pendingTeamCelebrationDate]);

  React.useEffect(() => {
    if (!inviteAvailable) {
      setShowInvite(false);
    }
  }, [inviteAvailable]);

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
          actions={<BoardActionsMenu inviteAvailable={inviteAvailable} onInvite={openInvite} teamId={teamId} />}
          celebration={celebration}
          celebrationNonce={celebrationNonce}
          className="mt-1"
          daysUntilStart={daysUntil}
          elapsedComplete={progressElapsedComplete}
          lastElapsedIsToday={progressLastElapsedIsToday}
          memberMode={memberMode}
          memberStatus={memberStatus}
          selectedDayNumber={dayNumber}
        />
      </header>

      {showInvite && inviteAvailable ? (
        <InviteModal inviteCode={inviteCode} joinUrl={joinUrl} onClose={closeInvite} />
      ) : null}

      {memberMode === "hard" && memberStatus === "failed" ? (
        <HardFailModal
          disabled={isPending}
          onExit={onExitChallenge}
          onFix={onFixHardFail}
          onMoveToSoft={onMoveToSoft}
        />
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
                endDate={endDate}
                hardCompletedDays={member.hardCompletedDays}
                isSelf={member.id === memberId}
                key={member.id}
                mode={member.mode}
                progressPhotoEndsOnly={member.progressPhotoEndsOnly}
                pulse={rosterPulseIntervalMs != null}
                pulseNonce={rosterPulseNonce}
                selectedDate={selectedDate}
                softStumble={member.softStumble}
                startDate={startDate}
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
        {memberStatus === "exited" ? <p className="text-sf-danger mt-3 text-sm">{t("failed")}</p> : null}
        <ul
          className={cn("mt-4 space-y-3", {
            "sf-day-settle": celebration === "day",
            "sf-day-settle-finale": celebration === "finale",
            "sf-day-settle-team": celebration === "team",
          })}
          key={celebrationNonce > 0 ? `checklist-${celebrationNonce}` : "checklist"}
        >
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

      {dayQuote != null ? <DayQuote author={dayQuote.author} text={dayQuote.text} /> : null}

      {error != null ? <p className="text-sf-danger mt-4 text-sm">{t(error)}</p> : null}

      {!isOwner ? (
        <button className="text-sf-muted mt-12 text-sm underline" onClick={onLeave} type="button">
          {t("leaveTeam")}
        </button>
      ) : null}
    </Container>
  );
};
