"use client";

import { TaskPreviewList } from "@/components/challenge/task-preview-list";
import { Checkbox } from "@/components/ui/checkbox";
import { Container } from "@/components/ui/container";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { savePushSubscriptionAction, updateMemberAction } from "@/lib/actions/member";
import { deleteTeamAction, updateTeamAction } from "@/lib/actions/team";
import { ensurePushSubscription, isIosDevice, isStandaloneDisplayMode } from "@/lib/browser/ensure-push-subscription";
import type { ChallengeMode } from "@/lib/challenge/tasks";
import type { TranslationKey } from "@/lib/i18n/i18next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type TeamSettingsFormProps = {
  endDate: string;
  isOwner: boolean;
  mode: ChallengeMode;
  reminderEnabled: boolean;
  reminderTime: string;
  startDate: string;
  startPassed: boolean;
  teamId: string;
  teamName: string;
  todayLocal: string;
  vapidPublicKey?: string;
};

export const TeamSettingsForm: React.FC<TeamSettingsFormProps> = (props) => {
  const {
    endDate,
    isOwner,
    mode,
    reminderEnabled,
    reminderTime,
    startDate,
    startPassed,
    teamId,
    teamName,
    todayLocal,
    vapidPublicKey,
  } = props;

  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<null | TranslationKey>(null);
  const [challengeMode, setChallengeMode] = React.useState<ChallengeMode>(mode);
  const [remindersOn, setRemindersOn] = React.useState(reminderEnabled);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [showIosHomeScreenHint, setShowIosHomeScreenHint] = React.useState(false);

  //* Handlers
  const handleTeamDetailsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await updateTeamAction({
        name: String(formData.get("name") ?? ""),
        startDate: String(formData.get("startDate") ?? ""),
        teamId,
      });
      if ("error" in result) {
        setError(result.error as TranslationKey);
        return;
      }
      toast.success(t("settingsSaved"));
      router.refresh();
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextRemindersOn = remindersOn;
    setError(null);

    startTransition(async () => {
      const result = await updateMemberAction({
        mode: challengeMode,
        reminderEnabled: nextRemindersOn,
        reminderTime: String(formData.get("reminderTime") ?? "20:00"),
        teamId,
      });

      if ("error" in result) {
        setError(result.error ?? "somethingWentWrong");
        return;
      }

      setRemindersOn(nextRemindersOn);

      if (nextRemindersOn) {
        if (vapidPublicKey == null || vapidPublicKey === "") {
          toast.warning(t("pushNotificationsAreNotConfigured"));
        } else if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          toast.warning(t("pushNotificationsAreNotSupportedInThisBrowser"));
        } else if (isIosDevice() && !isStandaloneDisplayMode()) {
          toast.warning(t("onIphoneAddThisAppToYourHomeScreenToReceiveReminders"));
        } else {
          try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
              toast.warning(t("notificationsWereBlockedEnableThemInYourBrowserToReceiveReminders"));
            } else {
              const payload = await ensurePushSubscription(vapidPublicKey);
              if (payload == null) {
                toast.warning(t("couldNotEnablePushNotifications"));
              } else {
                const saveResult = await savePushSubscriptionAction(payload);
                if ("error" in saveResult) {
                  toast.warning(t("couldNotEnablePushNotifications"));
                }
              }
            }
          } catch {
            toast.warning(t("couldNotEnablePushNotifications"));
          }
        }
      }

      toast.success(t("settingsSaved"));
      router.refresh();
    });
  };

  const handleChallengeModeChange = (value: string) => {
    setChallengeMode(value as ChallengeMode);
  };

  const handleRemindersChange = (checked: boolean | "indeterminate") => {
    setRemindersOn(checked === true);
  };

  const handleConfirmDeleteChange = (checked: boolean | "indeterminate") => {
    setConfirmDelete(checked === true);
  };

  const onDeleteTeam = () => {
    if (!confirmDelete) {
      return;
    }
    startTransition(async () => {
      const result = await deleteTeamAction({ confirm: true, teamId });
      if ("error" in result) {
        setError(result.error as TranslationKey);
      }
    });
  };

  //* Effects
  React.useEffect(() => {
    setRemindersOn(reminderEnabled);
  }, [reminderEnabled]);

  React.useEffect(() => {
    setChallengeMode(mode);
  }, [mode]);

  React.useEffect(() => {
    setShowIosHomeScreenHint(isIosDevice() && !isStandaloneDisplayMode());
  }, []);

  return (
    <Container as="main" className="flex-1 py-8">
      <Link className="text-sf-muted text-sm" href={`/teams/${teamId}`}>
        {`\u2190 ${t("backTo{{teamName}}", { teamName })}`}
      </Link>
      <h1 className="font-sf-display mt-6 text-3xl">{t("teamSettings")}</h1>

      {isOwner && !startPassed ? (
        <form className="border-sf-border mt-8 w-full space-y-4 border-b pb-8" onSubmit={handleTeamDetailsSubmit}>
          <h2 className="text-sf-muted text-xs font-medium tracking-[0.14em] uppercase">{t("team")}</h2>
          <div className="w-full space-y-1.5">
            <Label htmlFor="teamName">{t("teamName")}</Label>
            <input
              className="border-sf-border bg-sf-elevated block w-full rounded-[var(--sf-radius)] border px-3 py-2"
              defaultValue={teamName}
              id="teamName"
              name="name"
              required
            />
          </div>
          <div className="w-full space-y-1.5">
            <Label htmlFor="startDate">{t("startDate")}</Label>
            <input
              className="border-sf-border bg-sf-elevated block w-full rounded-[var(--sf-radius)] border px-3 py-2"
              defaultValue={startDate}
              id="startDate"
              min={todayLocal}
              name="startDate"
              required
              type="date"
            />
          </div>
          <p className="text-sf-muted text-xs">
            {t("endDate")}: {endDate}
          </p>
          <button
            className="bg-sf-accent text-sf-accent-text w-full rounded-[var(--sf-radius)] px-4 py-3 text-sm disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {t("save")}
          </button>
        </form>
      ) : null}

      <form className="mt-8 w-full space-y-8" onSubmit={handleSubmit}>
        <section className="w-full space-y-4">
          <div className="w-full space-y-2">
            <Label className="block w-full">{t("challenge")}</Label>
            <RadioGroup
              className="flex gap-4"
              disabled={startPassed}
              onValueChange={handleChallengeModeChange}
              value={challengeMode}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id="settings-mode-hard" value="hard" />
                <Label htmlFor="settings-mode-hard">{t("hard")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="settings-mode-soft" value="soft" />
                <Label htmlFor="settings-mode-soft">{t("soft")}</Label>
              </div>
            </RadioGroup>
            <TaskPreviewList mode={challengeMode} />
          </div>

          <div className="w-full space-y-1.5">
            <div className="flex w-full items-center gap-2">
              <Checkbox checked={remindersOn} id="reminderEnabled" onCheckedChange={handleRemindersChange} />
              <Label htmlFor="reminderEnabled">{t("enableDailyReminder")}</Label>
            </div>
            <p className="text-sf-muted text-xs">
              {t("beforeStartYouGetACountdownAfterStartYouGetANudgeIfTasksRemain")}
            </p>
            {remindersOn && showIosHomeScreenHint ? (
              <p className="text-sf-muted text-xs">{t("onIphoneAddThisAppToYourHomeScreenToReceiveReminders")}</p>
            ) : null}
            {remindersOn ? (
              <p className="text-sf-muted text-xs">{t("remindersMayArriveUpToAnHourAfterTheSetTime")}</p>
            ) : null}
          </div>

          <div className="w-full space-y-1.5">
            <Label htmlFor="reminderTime">{t("reminderTime")}</Label>
            <input
              className="border-sf-border bg-sf-elevated block w-full rounded-[var(--sf-radius)] border px-3 py-2"
              defaultValue={reminderTime.slice(0, 5)}
              id="reminderTime"
              name="reminderTime"
              type="time"
            />
          </div>
        </section>

        {error != null ? <p className="text-sf-danger text-sm">{t(error)}</p> : null}

        <button
          className="bg-sf-accent text-sf-accent-text w-full rounded-[var(--sf-radius)] px-4 py-3 text-sm disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {t("save")}
        </button>
      </form>

      <p className="mt-8 text-sm">
        <Link className="text-sf-muted underline" href="/settings">
          {t("accountSettings")}
        </Link>
      </p>

      {isOwner ? (
        <section className="border-sf-border mt-12 w-full space-y-4 border-t pt-8">
          <h2 className="text-sf-danger text-xs font-medium tracking-[0.14em] uppercase">{t("deleteTeam")}</h2>
          <p className="text-sf-muted text-sm">{t("thisWillPermanentlyDeleteTheTeamAndAllMemberData")}</p>
          <div className="flex w-full items-center gap-2">
            <Checkbox checked={confirmDelete} id="confirmDelete" onCheckedChange={handleConfirmDeleteChange} />
            <Label htmlFor="confirmDelete">{t("confirmDeleteTeam")}</Label>
          </div>
          <button
            className="border-sf-danger/40 text-sf-danger w-full rounded-[var(--sf-radius)] border px-4 py-3 text-sm disabled:opacity-40"
            disabled={isPending || !confirmDelete}
            onClick={onDeleteTeam}
            type="button"
          >
            {t("deleteTeam")}
          </button>
        </section>
      ) : null}
    </Container>
  );
};
