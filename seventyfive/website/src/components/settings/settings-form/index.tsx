"use client";

import { TaskPreviewList } from "@/components/challenge/task-preview-list";
import { TimeZoneSelect } from "@/components/timezone-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Container } from "@/components/ui/container";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { savePushSubscriptionAction, updateMemberAction } from "@/lib/actions/member";
import { deleteTeamAction } from "@/lib/actions/team";
import type { ChallengeMode } from "@/lib/challenge/tasks";
import type { TranslationKey } from "@/lib/i18n/i18next";
import { urlBase64ToUint8Array } from "@/lib/url-base64-to-uint8-array";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type SettingsFormProps = {
  displayName: string;
  isOwner: boolean;
  mode: ChallengeMode;
  reminderEnabled: boolean;
  reminderTime: string;
  startPassed: boolean;
  timeZone: string;
  vapidPublicKey?: string;
};

export const SettingsForm: React.FC<SettingsFormProps> = (props) => {
  const { displayName, isOwner, mode, reminderEnabled, reminderTime, startPassed, timeZone, vapidPublicKey } = props;

  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<null | TranslationKey>(null);
  const [challengeMode, setChallengeMode] = React.useState<ChallengeMode>(mode);
  const [remindersOn, setRemindersOn] = React.useState(reminderEnabled);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  //* Handlers
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
    setError(null);
    startTransition(async () => {
      const result = await deleteTeamAction({ confirm: true });
      if ("error" in result) {
        setError(result.error as TranslationKey);
      }
    });
  };

  const onSubmit = (formData: FormData) => {
    setError(null);

    startTransition(async () => {
      const result = await updateMemberAction({
        displayName: String(formData.get("displayName") ?? ""),
        mode: challengeMode,
        reminderEnabled: remindersOn,
        reminderTime: String(formData.get("reminderTime") ?? "20:00"),
        timeZone: String(formData.get("timeZone") ?? timeZone),
      });

      if ("error" in result) {
        setError(result.error ?? "somethingWentWrong");
        return;
      }

      if (remindersOn && vapidPublicKey && "serviceWorker" in navigator && "PushManager" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const registration = await navigator.serviceWorker.register("/sw.js");
          const subscription = await registration.pushManager.subscribe({
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
            userVisibleOnly: true,
          });
          const json = subscription.toJSON();
          if (json.endpoint != null && json.keys?.auth && json.keys.p256dh) {
            await savePushSubscriptionAction({
              auth: json.keys.auth,
              endpoint: json.endpoint,
              p256dh: json.keys.p256dh,
            });
          }
        }
      }

      router.refresh();
    });
  };

  return (
    <Container as="main" className="min-h-dvh py-8">
      <Link className="text-sf-muted text-sm" href="/team">
        {t("yourTeam")}
      </Link>
      <h1 className="font-sf-display mt-6 text-3xl">{t("settings")}</h1>

      <form action={onSubmit} className="mt-8 w-full space-y-8">
        <section aria-labelledby="settings-me-heading" className="w-full space-y-4">
          <h2 className="text-sf-muted text-xs font-medium tracking-[0.14em] uppercase" id="settings-me-heading">
            {t("me")}
          </h2>
          <div className="w-full space-y-1.5">
            <Label className="block w-full" htmlFor="displayName">
              {t("name")}
            </Label>
            <input
              className="border-sf-border bg-sf-elevated text-sf-text block w-full min-w-0 rounded-[var(--sf-radius)] border px-3 py-2"
              defaultValue={displayName}
              id="displayName"
              name="displayName"
              required
            />
          </div>

          <div className="w-full space-y-1.5">
            <Label className="block w-full" htmlFor="timeZone">
              {t("timezone")}
            </Label>
            <TimeZoneSelect defaultValue={timeZone} />
          </div>

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

          <div className="flex w-full items-center gap-2">
            <Checkbox checked={remindersOn} id="reminderEnabled" onCheckedChange={handleRemindersChange} />
            <Label htmlFor="reminderEnabled">{t("enableDailyReminder")}</Label>
          </div>

          <div className="w-full space-y-1.5">
            <Label className="block w-full" htmlFor="reminderTime">
              {t("reminderTime")}
            </Label>
            <input
              className="border-sf-border bg-sf-elevated text-sf-text block w-full min-w-0 rounded-[var(--sf-radius)] border px-3 py-2"
              defaultValue={reminderTime}
              id="reminderTime"
              name="reminderTime"
              type="time"
            />
          </div>
        </section>

        {error != null ? <p className="text-sf-danger text-sm">{t(error)}</p> : null}

        <button
          className="bg-sf-accent text-sf-accent-text w-full rounded-[var(--sf-radius)] px-4 py-3 text-sm font-medium disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {t("save")}
        </button>
      </form>

      {isOwner ? (
        <section
          aria-labelledby="settings-danger-heading"
          className="border-sf-border mt-12 w-full space-y-4 border-t pt-8"
        >
          <h2 className="text-sf-danger text-xs font-medium tracking-[0.14em] uppercase" id="settings-danger-heading">
            {t("deleteTeam")}
          </h2>
          <p className="text-sf-muted text-sm">{t("thisWillPermanentlyDeleteTheTeamAndAllMemberData")}</p>
          <div className="flex w-full items-center gap-2">
            <Checkbox checked={confirmDelete} id="confirmDelete" onCheckedChange={handleConfirmDeleteChange} />
            <Label htmlFor="confirmDelete">{t("confirmDeleteTeam")}</Label>
          </div>
          <button
            className="border-sf-danger/40 text-sf-danger w-full rounded-[var(--sf-radius)] border px-4 py-3 text-sm font-medium disabled:opacity-40"
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
