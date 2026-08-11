"use client";

import { TimeZoneSelect } from "@/components/timezone-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Container } from "@/components/ui/container";
import { Label } from "@/components/ui/label";
import {
  changePasswordAction,
  deleteAccountAction,
  generateNewPasswordAction,
  signOutAction,
  updateProfileAction,
} from "@/lib/actions/account";
import type { TranslationKey } from "@/lib/i18n/i18next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type AccountSettingsFormProps = {
  displayName: string;
  timeZone: string;
  username: string;
};

export const AccountSettingsForm: React.FC<AccountSettingsFormProps> = (props) => {
  const { displayName, timeZone, username } = props;

  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<null | TranslationKey>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [generatedPassword, setGeneratedPassword] = React.useState<null | string>(null);
  const [revealGenerated, setRevealGenerated] = React.useState(false);

  //* Handlers
  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await updateProfileAction({
        displayName: String(formData.get("displayName") ?? ""),
        timeZone: String(formData.get("timeZone") ?? timeZone),
        username: String(formData.get("username") ?? ""),
      });
      if ("error" in result) {
        setError(result.error as TranslationKey);
        return;
      }
      toast.success(t("settingsSaved"));
      router.refresh();
    });
  };

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword: String(formData.get("currentPassword") ?? ""),
        newPassword: String(formData.get("newPassword") ?? ""),
      });
      if ("error" in result) {
        setError(result.error as TranslationKey);
        return;
      }
      toast.success(t("passwordUpdated"));
      router.refresh();
    });
  };

  const onGeneratePassword = () => {
    setError(null);
    startTransition(async () => {
      const result = await generateNewPasswordAction();
      if ("error" in result) {
        setError(result.error as TranslationKey);
        return;
      }
      setGeneratedPassword(result.password ?? null);
      setRevealGenerated(true);
      toast.success(t("newPasswordGeneratedCopyItNow"));
    });
  };

  const copyGenerated = () => {
    if (generatedPassword == null) {
      return;
    }
    void navigator.clipboard.writeText(generatedPassword);
    toast.success(t("loginPasswordCopied"));
  };

  const toggleRevealGenerated = () => {
    setRevealGenerated((value) => {
      return !value;
    });
  };

  const handleConfirmDeleteChange = (checked: boolean | "indeterminate") => {
    setConfirmDelete(checked === true);
  };

  const onDelete = () => {
    if (!confirmDelete) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAccountAction({ confirm: true });
      if ("error" in result) {
        setError(result.error as TranslationKey);
      }
    });
  };

  return (
    <Container as="main" className="flex-1 py-8">
      <Link className="text-sf-muted text-sm" href="/teams">
        {t("yourTeams")}
      </Link>
      <h1 className="font-sf-display mt-6 text-3xl">{t("account")}</h1>

      <form className="mt-8 w-full space-y-4" onSubmit={handleProfileSubmit}>
        <div className="w-full space-y-1.5">
          <Label htmlFor="displayName">{t("name")}</Label>
          <input
            className="border-sf-border bg-sf-elevated block w-full rounded-[var(--sf-radius)] border px-3 py-2"
            defaultValue={displayName}
            id="displayName"
            name="displayName"
            required
          />
        </div>
        <div className="w-full space-y-1.5">
          <Label htmlFor="username">{t("username")}</Label>
          <input
            className="border-sf-border bg-sf-elevated block w-full rounded-[var(--sf-radius)] border px-3 py-2 font-mono text-sm"
            defaultValue={username}
            id="username"
            name="username"
            pattern="[a-z0-9]{3,30}"
            required
          />
        </div>
        <div className="w-full space-y-1.5">
          <Label htmlFor="timeZone">{t("timezone")}</Label>
          <TimeZoneSelect defaultValue={timeZone} />
        </div>
        <button
          className="bg-sf-accent text-sf-accent-text w-full rounded-[var(--sf-radius)] px-4 py-3 text-sm disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {t("save")}
        </button>
      </form>

      <form className="border-sf-border mt-10 w-full space-y-4 border-t pt-8" onSubmit={handlePasswordSubmit}>
        <h2 className="text-sf-muted text-xs font-medium tracking-[0.14em] uppercase">{t("password")}</h2>
        <div className="w-full space-y-1.5">
          <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
          <input
            className="border-sf-border bg-sf-elevated block w-full rounded-[var(--sf-radius)] border px-3 py-2"
            id="currentPassword"
            name="currentPassword"
            required
            type="password"
          />
        </div>
        <div className="w-full space-y-1.5">
          <Label htmlFor="newPassword">{t("newPassword")}</Label>
          <input
            className="border-sf-border bg-sf-elevated block w-full rounded-[var(--sf-radius)] border px-3 py-2"
            id="newPassword"
            minLength={8}
            name="newPassword"
            required
            type="password"
          />
        </div>
        <button
          className="border-sf-border w-full rounded-[var(--sf-radius)] border px-4 py-3 text-sm disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {t("changePassword")}
        </button>
        <button
          className="text-sf-muted w-full text-sm underline disabled:opacity-60"
          disabled={isPending}
          onClick={onGeneratePassword}
          type="button"
        >
          {t("generateNewPassword")}
        </button>
        {generatedPassword != null ? (
          <div className="border-sf-border space-y-2 rounded-[var(--sf-radius)] border p-3">
            <p className="text-sf-muted text-xs">{t("saveThisNowWeCanTShowYourPasswordAgain")}</p>
            <p className="font-mono text-sm break-all">{revealGenerated ? generatedPassword : "••••••••••••••••"}</p>
            <div className="flex gap-2">
              <button
                className="border-sf-border rounded-[var(--sf-radius)] border px-3 py-2 text-sm"
                onClick={toggleRevealGenerated}
                type="button"
              >
                {revealGenerated ? t("hide") : t("reveal")}
              </button>
              <button
                className="bg-sf-accent text-sf-accent-text rounded-[var(--sf-radius)] px-3 py-2 text-sm"
                onClick={copyGenerated}
                type="button"
              >
                {t("copyLoginPassword")}
              </button>
            </div>
          </div>
        ) : null}
      </form>

      {error != null ? <p className="text-sf-danger mt-4 text-sm">{t(error)}</p> : null}

      <form action={signOutAction} className="mt-10">
        <button className="text-sf-muted text-sm underline" type="submit">
          {t("signOut")}
        </button>
      </form>

      <section className="border-sf-border mt-12 space-y-4 border-t pt-8">
        <h2 className="text-sf-danger text-xs font-medium tracking-[0.14em] uppercase">{t("deleteAccount")}</h2>
        <p className="text-sf-muted text-sm">{t("thisDeletesYourAccountAndTransfersOrRemovesOwnedTeams")}</p>
        <div className="flex items-center gap-2">
          <Checkbox checked={confirmDelete} id="confirmDeleteAccount" onCheckedChange={handleConfirmDeleteChange} />
          <Label htmlFor="confirmDeleteAccount">{t("confirmDeleteAccount")}</Label>
        </div>
        <button
          className="border-sf-danger/40 text-sf-danger w-full rounded-[var(--sf-radius)] border px-4 py-3 text-sm disabled:opacity-40"
          disabled={isPending || !confirmDelete}
          onClick={onDelete}
          type="button"
        >
          {t("deleteAccount")}
        </button>
      </section>
    </Container>
  );
};
