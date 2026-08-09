"use client";

import { RosterRow } from "@/components/team/roster-row";
import { TaskRow } from "@/components/team/task-row";
import { setTaskCheckedAction } from "@/lib/actions/tasks";
import { leaveTeamAction, updateTeamAction } from "@/lib/actions/team";
import { canEditDay, tasksForMode, type ChallengeMode, type MemberStatus } from "@/lib/challenge/tasks";
import type { TranslationKey } from "@/lib/i18n/i18next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type RosterMember = {
  checkedCount: number;
  displayName: string;
  id: string;
  mode: ChallengeMode;
  softStumble: boolean;
  status: MemberStatus;
  totalTasks: number;
};

export type TeamBoardProps = {
  checkedTaskIds: string[];
  endDate: string;
  inviteCode: string;
  isOwner: boolean;
  memberId: string;
  memberMode: ChallengeMode;
  memberStatus: MemberStatus;
  roster: RosterMember[];
  selectedDate: string;
  startDate: string;
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
    roster,
    selectedDate,
    startDate,
    teamName,
    todayLocal,
  } = props;

  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [showInvite, setShowInvite] = React.useState(false);
  const [error, setError] = React.useState<null | TranslationKey>(null);

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
      });
      if ("error" in result) {
        setError(result.error ?? "somethingWentWrong");
        return;
      }
      router.refresh();
    });
  };

  const onOwnerSave = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateTeamAction({
        name: String(formData.get("name") ?? ""),
        startDate: String(formData.get("startDate") ?? ""),
      });
      if ("error" in result) {
        setError(result.error as TranslationKey);
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
  };

  const copyJoinLink = () => {
    void navigator.clipboard.writeText(joinUrl);
  };

  const onDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(window.location.search);
    params.set("date", event.target.value);
    router.push(`/team?${params.toString()}`);
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-6 py-8 pr-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sf-display text-3xl tracking-tight">{teamName}</p>
          <p className="text-sf-muted mt-1 text-sm">{t("day{{day}}Of75", { day: dayNumber })}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button
            className="border-sf-border rounded-[var(--sf-radius)] border px-3 py-1.5"
            onClick={toggleInvite}
            type="button"
          >
            {t("invite")}
          </button>
          <Link className="border-sf-border rounded-[var(--sf-radius)] border px-3 py-1.5" href="/settings">
            {t("settings")}
          </Link>
        </div>
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
              {t("copyPassword")}
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

      {isOwner && startDate > todayLocal ? (
        <form action={onOwnerSave} className="border-sf-border mt-6 space-y-3 border-b pb-6">
          <label className="block space-y-1 text-sm">
            <span className="text-sf-muted">{t("teamName")}</span>
            <input
              className="border-sf-border bg-sf-elevated w-full rounded-[var(--sf-radius)] border px-3 py-2"
              defaultValue={teamName}
              name="name"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-sf-muted">{t("startDate")}</span>
            <input
              className="border-sf-border bg-sf-elevated w-full rounded-[var(--sf-radius)] border px-3 py-2"
              defaultValue={startDate}
              name="startDate"
              type="date"
            />
          </label>
          <p className="text-sf-muted text-xs">
            {t("endDate")}: {endDate}
          </p>
          <button className="border-sf-border rounded-[var(--sf-radius)] border px-3 py-2 text-sm" type="submit">
            {t("save")}
          </button>
        </form>
      ) : null}

      <label className="mt-8 block space-y-1 text-sm">
        <span className="text-sf-muted">{selectedDate === todayLocal ? t("today") : selectedDate}</span>
        <input
          className="border-sf-border bg-sf-elevated w-full rounded-[var(--sf-radius)] border px-3 py-2"
          max={endDate}
          min={startDate}
          onChange={onDateChange}
          type="date"
          value={selectedDate}
        />
      </label>

      <section className="mt-8">
        <h2 className="text-sf-muted text-xs font-medium tracking-[0.14em] uppercase">{t("yourTeam")}</h2>
        <ul className="divide-sf-border mt-3 divide-y">
          {roster.map((member) => {
            return (
              <RosterRow
                checkedCount={member.checkedCount}
                displayName={member.displayName}
                isSelf={member.id === memberId}
                key={member.id}
                mode={member.mode}
                softStumble={member.softStumble}
                status={member.status}
                totalTasks={member.totalTasks}
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

      <form action={leaveTeamAction} className="mt-12">
        <button className="text-sf-muted text-sm underline" type="submit">
          {t("leaveTeam")}
        </button>
      </form>
    </main>
  );
};
