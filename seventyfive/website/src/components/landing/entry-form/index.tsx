"use client";

import { TaskPreviewList } from "@/components/challenge/task-preview-list";
import { TimeZoneSelect } from "@/components/timezone-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createTeamAction, joinTeamAction } from "@/lib/actions/team";
import type { ChallengeMode } from "@/lib/challenge/tasks";
import { browserLocalDateString, defaultStartDate } from "@/lib/default-start-date";
import type { TranslationKey } from "@/lib/i18n/i18next";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type EntryFormProps = (
  | {
      initialCode?: never;
      mode: "create";
    }
  | {
      initialCode?: string;
      mode: "join";
    }
) & {
  hasExistingSession: boolean;
};

export const EntryForm: React.FC<EntryFormProps> = (props) => {
  const { hasExistingSession, initialCode, mode } = props;

  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<null | TranslationKey>(null);
  const [invitePassword, setInvitePassword] = React.useState<null | string>(null);
  const [challengeMode, setChallengeMode] = React.useState<ChallengeMode>("hard");
  const [replaceSession, setReplaceSession] = React.useState(false);

  //* Handlers
  const onSubmit = (formData: FormData) => {
    setError(null);
    const displayName = String(formData.get("displayName") ?? "");
    const timeZone = String(formData.get("timeZone") ?? "");

    startTransition(async () => {
      if (mode === "create") {
        const result = await createTeamAction({
          displayName,
          mode: challengeMode,
          replaceSession,
          startDate: String(formData.get("startDate") ?? ""),
          teamName: String(formData.get("teamName") ?? ""),
          timeZone,
        });

        if ("error" in result) {
          setError(result.error as TranslationKey);
          return;
        }

        setInvitePassword(result.password ?? null);
        return;
      }

      const result = await joinTeamAction({
        displayName,
        mode: challengeMode,
        password: String(formData.get("password") ?? ""),
        replaceSession,
        timeZone,
      });

      if ("error" in result) {
        setError(result.error as TranslationKey);
        return;
      }

      router.push("/team");
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

  const goToTeam = () => {
    router.push("/team");
    router.refresh();
  };

  const handleChallengeModeChange = (value: string) => {
    setChallengeMode(value as ChallengeMode);
  };

  const handleReplaceSessionChange = (checked: boolean | "indeterminate") => {
    setReplaceSession(checked === true);
  };

  if (invitePassword != null) {
    return (
      <div className="sf-rise space-y-4">
        <p className="font-sf-display text-sf-text text-2xl">{t("invite")}</p>
        <p className="text-sf-muted text-sm">
          {t("shareThisPasswordWithYourTeamAnyoneWithItCanJoinBeforeTheStartDate")}
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
            onClick={goToTeam}
            type="button"
          >
            {t("yourTeam")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="sf-rise w-full space-y-8">
      <section aria-labelledby="entry-team-heading" className="w-full space-y-4">
        <h2 className="text-sf-muted text-xs font-medium tracking-[0.14em] uppercase" id="entry-team-heading">
          {t("team")}
        </h2>
        {mode === "create" ? (
          <>
            <div className="w-full space-y-1.5">
              <Label className="block w-full" htmlFor="teamName">
                {t("teamName")}
              </Label>
              <input
                className="border-sf-border bg-sf-elevated text-sf-text block w-full min-w-0 rounded-[var(--sf-radius)] border px-3 py-2"
                id="teamName"
                name="teamName"
                required
              />
            </div>
            <div className="w-full space-y-1.5">
              <Label className="block w-full" htmlFor="startDate">
                {t("startDate")}
              </Label>
              <input
                className="border-sf-border bg-sf-elevated text-sf-text block w-full min-w-0 rounded-[var(--sf-radius)] border px-3 py-2"
                defaultValue={defaultStartDate()}
                id="startDate"
                min={browserLocalDateString()}
                name="startDate"
                required
                type="date"
              />
            </div>
          </>
        ) : (
          <div className="w-full space-y-1.5">
            <Label className="block w-full" htmlFor="password">
              {t("teamPassword")}
            </Label>
            <input
              className="border-sf-border bg-sf-elevated text-sf-text block w-full min-w-0 rounded-[var(--sf-radius)] border px-3 py-2 font-mono text-xs"
              defaultValue={initialCode ?? ""}
              id="password"
              name="password"
              required
            />
          </div>
        )}
      </section>

      <section aria-labelledby="entry-me-heading" className="w-full space-y-4">
        <h2 className="text-sf-muted text-xs font-medium tracking-[0.14em] uppercase" id="entry-me-heading">
          {t("me")}
        </h2>
        <div className="w-full space-y-1.5">
          <Label className="block w-full" htmlFor="displayName">
            {t("name")}
          </Label>
          <input
            className="border-sf-border bg-sf-elevated text-sf-text block w-full min-w-0 rounded-[var(--sf-radius)] border px-3 py-2"
            id="displayName"
            name="displayName"
            required
          />
        </div>

        <div className="w-full space-y-1.5">
          <Label className="block w-full" htmlFor="timeZone">
            {t("timezone")}
          </Label>
          <TimeZoneSelect />
        </div>

        <div className="w-full space-y-2">
          <Label className="block w-full">{t("challenge")}</Label>
          <RadioGroup className="flex gap-4" onValueChange={handleChallengeModeChange} value={challengeMode}>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="mode-hard" value="hard" />
              <Label htmlFor="mode-hard">{t("hard")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="mode-soft" value="soft" />
              <Label htmlFor="mode-soft">{t("soft")}</Label>
            </div>
          </RadioGroup>
          <TaskPreviewList mode={challengeMode} />
        </div>

        {hasExistingSession ? (
          <div className="flex w-full items-center gap-2">
            <Checkbox checked={replaceSession} id="replaceSession" onCheckedChange={handleReplaceSessionChange} />
            <Label htmlFor="replaceSession">{t("alreadyInATeamConfirmToSwitch")}</Label>
          </div>
        ) : null}
      </section>

      {error != null ? <p className="text-sf-danger text-sm">{t(error)}</p> : null}

      <button
        className="bg-sf-accent text-sf-accent-text w-full rounded-[var(--sf-radius)] px-4 py-3 text-sm font-medium disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {mode === "create" ? t("createTeam") : t("joinTeam")}
      </button>
    </form>
  );
};
