"use client";

import { TaskPreviewList } from "@/components/challenge/task-preview-list";
import { TimeZoneSelect } from "@/components/timezone-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { acknowledgePasswordSavedAction } from "@/lib/actions/account";
import { createTeamAction, joinTeamAction } from "@/lib/actions/team";
import { browserTimeZone } from "@/lib/browser-timezone";
import { compareDateOnly, startDateBoundsForTimeZone, type ChallengeMode } from "@/lib/challenge/tasks";
import type { TranslationKey } from "@/lib/i18n/i18next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { CredsState } from "./types";

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
  isSignedIn: boolean;
  profileDisplayName?: string;
  profileTimeZone?: string;
};

export const EntryForm: React.FC<EntryFormProps> = (props) => {
  const { initialCode, isSignedIn, mode, profileDisplayName, profileTimeZone } = props;

  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<null | TranslationKey>(null);
  const [creds, setCreds] = React.useState<null | CredsState>(null);
  const [savedAck, setSavedAck] = React.useState(false);
  const [challengeMode, setChallengeMode] = React.useState<ChallengeMode>("hard");
  const [timeZone, setTimeZone] = React.useState<null | string>(profileTimeZone ?? null);
  const [minStartDate, setMinStartDate] = React.useState("");
  const [startDate, setStartDate] = React.useState("");

  //* Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    const displayName = String(formData.get("displayName") ?? profileDisplayName ?? "");
    const nextTimeZone = String(formData.get("timeZone") ?? timeZone ?? profileTimeZone ?? browserTimeZone());

    startTransition(async () => {
      if (mode === "create") {
        const result = await createTeamAction({
          displayName: isSignedIn ? undefined : displayName,
          mode: challengeMode,
          startDate: String(formData.get("startDate") ?? startDate),
          teamName: String(formData.get("teamName") ?? ""),
          timeZone: isSignedIn ? undefined : nextTimeZone,
        });

        // Prefer showing one-time credentials even when the later team write failed.
        if (result.password != null && result.username != null) {
          setCreds({
            inviteCode: "inviteCode" in result ? result.inviteCode : undefined,
            password: result.password,
            teamId: "teamId" in result ? result.teamId : undefined,
            username: result.username,
          });
          if ("error" in result) {
            setError(result.error as TranslationKey);
          }
          return;
        }

        if ("error" in result) {
          setError(result.error as TranslationKey);
          return;
        }

        router.push(`/teams/${result.teamId}`);
        router.refresh();
        return;
      }

      const result = await joinTeamAction({
        displayName: isSignedIn ? undefined : displayName,
        mode: challengeMode,
        password: String(formData.get("password") ?? ""),
        timeZone: isSignedIn ? undefined : nextTimeZone,
      });

      if (result.password != null && result.username != null) {
        setCreds({
          password: result.password,
          teamId: "teamId" in result ? result.teamId : undefined,
          username: result.username,
        });
        if ("error" in result) {
          setError(result.error as TranslationKey);
        }
        return;
      }

      if ("error" in result) {
        setError(result.error as TranslationKey);
        return;
      }

      router.push(`/teams/${result.teamId}`);
      router.refresh();
    });
  };

  const copyLoginPassword = () => {
    if (creds == null) {
      return;
    }
    void navigator.clipboard.writeText(creds.password);
    toast.success(t("loginPasswordCopied"));
  };

  const copyUsername = () => {
    if (creds == null) {
      return;
    }
    void navigator.clipboard.writeText(creds.username);
    toast.success(t("usernameCopied"));
  };

  const copyInvite = () => {
    if (creds?.inviteCode == null) {
      return;
    }
    void navigator.clipboard.writeText(creds.inviteCode);
    toast.success(t("teamInvitePasswordCopied"));
  };

  const continueAfterAck = () => {
    if (creds == null || !savedAck) {
      return;
    }
    startTransition(async () => {
      await acknowledgePasswordSavedAction();
      router.push(creds.teamId != null ? `/teams/${creds.teamId}` : "/teams");
      router.refresh();
    });
  };

  const handleChallengeModeChange = (value: string) => {
    setChallengeMode(value as ChallengeMode);
  };

  const handleTimeZoneChange = (nextTimeZone: string) => {
    setTimeZone(nextTimeZone);
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(event.target.value);
  };

  const handleSavedAckChange = (checked: boolean | "indeterminate") => {
    setSavedAck(checked === true);
  };

  //* Effects
  React.useEffect(() => {
    if (isSignedIn) {
      return;
    }
    setTimeZone(browserTimeZone());
  }, [isSignedIn]);

  React.useEffect(() => {
    if (timeZone == null || mode !== "create") {
      return;
    }
    const bounds = startDateBoundsForTimeZone(timeZone);
    setMinStartDate(bounds.min);
    setStartDate((current) => {
      if (current === "" || compareDateOnly(current, bounds.min) < 0) {
        return bounds.defaultValue;
      }
      return current;
    });
  }, [mode, timeZone]);

  if (creds != null) {
    return (
      <div className="sf-rise space-y-4">
        <p className="font-sf-display text-sf-text text-2xl">{t("saveYourLogin")}</p>
        <p className="text-sf-muted text-sm">{t("saveThisNowWeCanTShowYourPasswordAgain")}</p>
        <div className="border-sf-border space-y-2 rounded-[var(--sf-radius)] border p-3">
          <p className="text-sf-muted text-xs uppercase">{t("yourLogin")}</p>
          <p className="font-mono text-sm">
            {t("username")}: {creds.username}
          </p>
          <p className="font-mono text-sm break-all">
            {t("loginPassword")}: {creds.password}
          </p>
          <div className="flex flex-col gap-2">
            <button
              className="border-sf-border rounded-[var(--sf-radius)] border px-3 py-2 text-sm"
              onClick={copyUsername}
              type="button"
            >
              {t("copyUsername")}
            </button>
            <button
              className="bg-sf-accent text-sf-accent-text rounded-[var(--sf-radius)] px-3 py-2 text-sm"
              onClick={copyLoginPassword}
              type="button"
            >
              {t("copyLoginPassword")}
            </button>
          </div>
        </div>
        {creds.inviteCode != null ? (
          <div className="border-sf-border space-y-2 rounded-[var(--sf-radius)] border p-3">
            <p className="text-sf-muted text-xs uppercase">{t("teamInvite")}</p>
            <code className="block text-xs break-all">{creds.inviteCode}</code>
            <button
              className="border-sf-border rounded-[var(--sf-radius)] border px-3 py-2 text-sm"
              onClick={copyInvite}
              type="button"
            >
              {t("copyTeamInvitePassword")}
            </button>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <Checkbox checked={savedAck} id="savedAck" onCheckedChange={handleSavedAckChange} />
          <Label htmlFor="savedAck">{t("iSavedMyPassword")}</Label>
        </div>
        <button
          className="bg-sf-accent text-sf-accent-text w-full rounded-[var(--sf-radius)] px-4 py-3 text-sm font-medium disabled:opacity-60"
          disabled={!savedAck || isPending}
          onClick={continueAfterAck}
          type="button"
        >
          {t("continue")}
        </button>
      </div>
    );
  }

  return (
    <form className="sf-rise w-full space-y-8" onSubmit={handleSubmit}>
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
            {!isSignedIn ? (
              <div className="w-full space-y-1.5">
                <Label className="block w-full" htmlFor="timeZone">
                  {t("timezone")}
                </Label>
                {timeZone != null ? (
                  <TimeZoneSelect onValueChange={handleTimeZoneChange} value={timeZone} />
                ) : (
                  <div className="border-sf-border bg-sf-elevated h-10 w-full rounded-[var(--sf-radius)] border" />
                )}
              </div>
            ) : null}
            <div className="w-full space-y-1.5">
              <Label className="block w-full" htmlFor="startDate">
                {t("startDate")}
              </Label>
              <input
                className="border-sf-border bg-sf-elevated text-sf-text block w-full min-w-0 rounded-[var(--sf-radius)] border px-3 py-2"
                id="startDate"
                min={minStartDate || undefined}
                name="startDate"
                onChange={handleStartDateChange}
                required
                type="date"
                value={startDate}
              />
            </div>
          </>
        ) : (
          <div className="w-full space-y-1.5">
            <Label className="block w-full" htmlFor="password">
              {t("teamInvitePassword")}
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
        {!isSignedIn ? (
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
        ) : (
          <p className="text-sf-muted text-sm">{t("signedInAs{{name}}", { name: profileDisplayName ?? "" })}</p>
        )}

        {mode === "join" && !isSignedIn && timeZone != null ? (
          <div className="w-full space-y-1.5">
            <Label className="block w-full" htmlFor="timeZone">
              {t("timezone")}
            </Label>
            <TimeZoneSelect onValueChange={handleTimeZoneChange} value={timeZone} />
          </div>
        ) : null}

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
      </section>

      {error != null ? <p className="text-sf-danger text-sm">{t(error)}</p> : null}

      {!isSignedIn ? (
        <p className="text-sf-muted text-xs">
          <Trans
            components={{
              1: <Link className="underline" href="/sign-in" />,
            }}
            i18nKey="alreadyHaveAnAccountSignIn"
          />
        </p>
      ) : null}

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
