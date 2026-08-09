"use client";

import { createGroupAction, joinGroupAction } from "@/lib/actions/group";
import { browserTimeZone } from "@/lib/browser-timezone";
import { defaultStartDate } from "@/lib/default-start-date";
import type { TranslationKey } from "@/lib/i18n/i18next";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type EntryFormProps =
  | {
      initialCode?: never;
      mode: "create";
    }
  | {
      initialCode?: string;
      mode: "join";
    };

export const EntryForm: React.FC<EntryFormProps> = (props) => {
  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<null | TranslationKey>(null);
  const [invitePassword, setInvitePassword] = React.useState<null | string>(null);

  //* Handlers
  const onSubmit = (formData: FormData) => {
    setError(null);
    const displayName = String(formData.get("displayName") ?? "");
    const challengeMode = String(formData.get("challengeMode") ?? "hard") as "hard" | "soft";
    const timeZone = browserTimeZone();

    startTransition(async () => {
      if (props.mode === "create") {
        const result = await createGroupAction({
          displayName,
          groupName: String(formData.get("groupName") ?? ""),
          mode: challengeMode,
          replaceSession: formData.get("replaceSession") === "on",
          startDate: String(formData.get("startDate") ?? ""),
          timeZone,
        });

        if ("error" in result) {
          setError(result.error as TranslationKey);
          return;
        }

        setInvitePassword(result.password ?? null);
        return;
      }

      const result = await joinGroupAction({
        displayName,
        mode: challengeMode,
        password: String(formData.get("password") ?? ""),
        replaceSession: formData.get("replaceSession") === "on",
        timeZone,
      });

      if ("error" in result) {
        setError(result.error as TranslationKey);
        return;
      }

      router.push("/group");
      router.refresh();
    });
  };

  const copyPassword = () => {
    if (invitePassword == null) {
      return;
    }
    void navigator.clipboard.writeText(invitePassword);
  };

  const copyJoinLink = () => {
    if (invitePassword == null) {
      return;
    }
    const joinUrl = `${window.location.origin}/join?code=${encodeURIComponent(invitePassword)}`;
    void navigator.clipboard.writeText(joinUrl);
  };

  const goToGroup = () => {
    router.push("/group");
    router.refresh();
  };

  if (invitePassword != null) {
    return (
      <div className="sf-rise space-y-4">
        <p className="font-sf-display text-sf-text text-2xl">{t("invite")}</p>
        <p className="text-sf-muted text-sm">
          {t("shareThisPasswordWithYourGroupAnyoneWithItCanJoinBeforeTheStartDate")}
        </p>
        <code className="border-sf-border bg-sf-elevated block rounded-[var(--sf-radius)] border p-3 text-xs break-all">
          {invitePassword}
        </code>
        <div className="flex flex-col gap-2">
          <button
            className="bg-sf-accent text-sf-accent-text rounded-[var(--sf-radius)] px-4 py-3 text-sm font-medium"
            onClick={copyPassword}
            type="button"
          >
            {t("copyPassword")}
          </button>
          <button
            className="border-sf-border rounded-[var(--sf-radius)] border px-4 py-3 text-sm"
            onClick={copyJoinLink}
            type="button"
          >
            {t("copyJoinLink")}
          </button>
          <button
            className="border-sf-border rounded-[var(--sf-radius)] border px-4 py-3 text-sm"
            onClick={goToGroup}
            type="button"
          >
            {t("yourGroup")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="sf-rise space-y-4">
      {props.mode === "create" ? (
        <>
          <label className="block space-y-1 text-sm">
            <span className="text-sf-muted">{t("groupName")}</span>
            <input
              className="border-sf-border bg-sf-elevated w-full rounded-[var(--sf-radius)] border px-3 py-2"
              name="groupName"
              required
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-sf-muted">{t("startDate")}</span>
            <input
              className="border-sf-border bg-sf-elevated w-full rounded-[var(--sf-radius)] border px-3 py-2"
              defaultValue={defaultStartDate()}
              name="startDate"
              required
              type="date"
            />
          </label>
        </>
      ) : (
        <label className="block space-y-1 text-sm">
          <span className="text-sf-muted">{t("groupPassword")}</span>
          <input
            className="border-sf-border bg-sf-elevated w-full rounded-[var(--sf-radius)] border px-3 py-2 font-mono text-xs"
            defaultValue={props.initialCode ?? ""}
            name="password"
            required
          />
        </label>
      )}

      <label className="block space-y-1 text-sm">
        <span className="text-sf-muted">{t("displayName")}</span>
        <input
          className="border-sf-border bg-sf-elevated w-full rounded-[var(--sf-radius)] border px-3 py-2"
          name="displayName"
          required
        />
      </label>

      <fieldset className="space-y-2 text-sm">
        <legend className="text-sf-muted">
          {t("hard")} / {t("soft")}
        </legend>
        <label className="mr-4 inline-flex items-center gap-2">
          <input defaultChecked name="challengeMode" type="radio" value="hard" />
          {t("hard")}
        </label>
        <label className="inline-flex items-center gap-2">
          <input name="challengeMode" type="radio" value="soft" />
          {t("soft")}
        </label>
      </fieldset>

      <label className="text-sf-muted flex items-center gap-2 text-sm">
        <input name="replaceSession" type="checkbox" />
        {t("alreadyInAGroupConfirmToSwitch")}
      </label>

      {error != null ? <p className="text-sf-danger text-sm">{t(error)}</p> : null}

      <button
        className="bg-sf-accent text-sf-accent-text w-full rounded-[var(--sf-radius)] px-4 py-3 text-sm font-medium disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {props.mode === "create" ? t("createGroup") : t("joinGroup")}
      </button>
    </form>
  );
};
