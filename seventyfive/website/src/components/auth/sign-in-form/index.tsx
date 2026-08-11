"use client";

import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/better-auth/client";
import type { TranslationKey } from "@/lib/i18n/i18next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Trans, useTranslation } from "react-i18next";

export const SignInForm: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<null | TranslationKey>(null);

  //* Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await authClient.signIn.username({
        password: String(formData.get("password") ?? ""),
        username: String(formData.get("username") ?? "")
          .trim()
          .toLowerCase(),
      });
      if (result.error != null) {
        setError("invalidUsernameOrPassword");
        return;
      }
      router.push("/");
      router.refresh();
    });
  };

  return (
    <form className="w-full space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="username">{t("username")}</Label>
        <input
          autoComplete="username"
          className="border-sf-border bg-sf-elevated block w-full rounded-[var(--sf-radius)] border px-3 py-2"
          id="username"
          name="username"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <input
          autoComplete="current-password"
          className="border-sf-border bg-sf-elevated block w-full rounded-[var(--sf-radius)] border px-3 py-2"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>
      {error != null ? <p className="text-sf-danger text-sm">{t(error)}</p> : null}
      <button
        className="bg-sf-accent text-sf-accent-text w-full rounded-[var(--sf-radius)] px-4 py-3 text-sm disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {t("signIn")}
      </button>
      <p className="text-sf-muted text-xs">
        <Trans
          components={{
            1: <Link className="underline" href="/create" />,
          }}
          i18nKey="needAnAccountCreateATeam"
        />
      </p>
    </form>
  );
};
