"use client";

import { savePushSubscriptionAction, updateMemberAction } from "@/lib/actions/member";
import type { ChallengeMode } from "@/lib/challenge/tasks";
import type { TranslationKey } from "@/lib/i18n/i18next";
import { urlBase64ToUint8Array } from "@/lib/url-base64-to-uint8-array";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type SettingsFormProps = {
  displayName: string;
  mode: ChallengeMode;
  reminderEnabled: boolean;
  reminderTime: string;
  startPassed: boolean;
  timeZone: string;
  vapidPublicKey?: string;
};

export const SettingsForm: React.FC<SettingsFormProps> = (props) => {
  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<null | TranslationKey>(null);

  //* Handlers
  const onSubmit = (formData: FormData) => {
    setError(null);
    const reminderEnabled = formData.get("reminderEnabled") === "on";

    startTransition(async () => {
      const result = await updateMemberAction({
        displayName: String(formData.get("displayName") ?? ""),
        mode: String(formData.get("challengeMode") ?? props.mode) as ChallengeMode,
        reminderEnabled,
        reminderTime: String(formData.get("reminderTime") ?? "20:00"),
        timeZone: String(formData.get("timeZone") ?? props.timeZone),
      });

      if ("error" in result) {
        setError(result.error ?? "somethingWentWrong");
        return;
      }

      if (reminderEnabled && props.vapidPublicKey && "serviceWorker" in navigator && "PushManager" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const registration = await navigator.serviceWorker.register("/sw.js");
          const subscription = await registration.pushManager.subscribe({
            applicationServerKey: urlBase64ToUint8Array(props.vapidPublicKey) as BufferSource,
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
    <main className="mx-auto min-h-dvh w-full max-w-lg px-6 py-8">
      <Link className="text-sf-muted text-sm" href="/group">
        {t("yourGroup")}
      </Link>
      <h1 className="font-sf-display mt-6 text-3xl">{t("settings")}</h1>

      <form action={onSubmit} className="mt-8 space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="text-sf-muted">{t("displayName")}</span>
          <input
            className="border-sf-border bg-sf-elevated w-full rounded-[var(--sf-radius)] border px-3 py-2"
            defaultValue={props.displayName}
            name="displayName"
            required
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-sf-muted">{t("timezone")}</span>
          <input
            className="border-sf-border bg-sf-elevated w-full rounded-[var(--sf-radius)] border px-3 py-2"
            defaultValue={props.timeZone}
            name="timeZone"
            required
          />
        </label>

        <fieldset className="space-y-2 text-sm" disabled={props.startPassed}>
          <legend className="text-sf-muted">
            {t("hard")} / {t("soft")}
          </legend>
          <label className="mr-4 inline-flex items-center gap-2">
            <input defaultChecked={props.mode === "hard"} name="challengeMode" type="radio" value="hard" />
            {t("hard")}
          </label>
          <label className="inline-flex items-center gap-2">
            <input defaultChecked={props.mode === "soft"} name="challengeMode" type="radio" value="soft" />
            {t("soft")}
          </label>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input defaultChecked={props.reminderEnabled} name="reminderEnabled" type="checkbox" />
          {t("enableDailyReminder")}
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-sf-muted">{t("reminderTime")}</span>
          <input
            className="border-sf-border bg-sf-elevated w-full rounded-[var(--sf-radius)] border px-3 py-2"
            defaultValue={props.reminderTime}
            name="reminderTime"
            type="time"
          />
        </label>

        {error != null ? <p className="text-sf-danger text-sm">{t(error)}</p> : null}

        <button
          className="bg-sf-accent text-sf-accent-text rounded-[var(--sf-radius)] px-4 py-3 text-sm font-medium disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {t("save")}
        </button>
      </form>
    </main>
  );
};
