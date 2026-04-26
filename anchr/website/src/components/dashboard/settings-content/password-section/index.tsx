"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/better-auth/client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// BA password change. Verifies the current password and rotates it; the
// "I forgot my password" path is handled separately via /forgot-password
// (BA's emailed reset link), so this section stays focused on the in-session
// rotation.
export const PasswordSection: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<null | string>(null);

  //* Handlers
  const resetState = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const validatePasswords = (): boolean => {
    if (newPassword.length < 8) {
      setError(t("passwordMustBeAtLeast8Characters"));
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return false;
    }

    return true;
  };

  const handlePasswordUpdate = async () => {
    if (!validatePasswords()) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        // Defense-in-depth: rotate sessions on password change so a
        // compromised cookie elsewhere is invalidated immediately.
        revokeOtherSessions: true,
      });

      if (result.error != null) {
        setError(result.error.message ?? t("somethingWentWrongPleaseTryAgain"));
        return;
      }

      toast.success(t("passwordUpdated"));
      resetState();
    } finally {
      setPending(false);
    }
  };

  const handleCurrentPasswordOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value);
  const handleNewPasswordOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value);
  const handleConfirmPasswordOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("password")}</CardTitle>
        <CardDescription>{t("updateYourPassword")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-muted-foreground mb-2 block text-sm font-medium" htmlFor="currentPassword">
            {t("currentPassword")}
          </Label>
          <Input
            autoComplete="current-password"
            disabled={pending}
            id="currentPassword"
            onChange={handleCurrentPasswordOnChange}
            type="password"
            value={currentPassword}
          />
        </div>
        <div>
          <Label className="text-muted-foreground mb-2 block text-sm font-medium" htmlFor="settingsNewPassword">
            {t("newPassword")}
          </Label>
          <Input
            autoComplete="new-password"
            disabled={pending}
            id="settingsNewPassword"
            onChange={handleNewPasswordOnChange}
            type="password"
            value={newPassword}
          />
        </div>
        <div>
          <Label className="text-muted-foreground mb-2 block text-sm font-medium" htmlFor="settingsConfirmPassword">
            {t("confirmPassword")}
          </Label>
          <Input
            autoComplete="new-password"
            disabled={pending}
            id="settingsConfirmPassword"
            onChange={handleConfirmPasswordOnChange}
            type="password"
            value={confirmPassword}
          />
        </div>
        {error != null && <p className="text-destructive text-xs">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={
              pending || currentPassword.length === 0 || newPassword.length === 0 || confirmPassword.length === 0
            }
            onClick={handlePasswordUpdate}
            variant="secondary"
          >
            {pending && <Loader2 className="size-3.5 animate-spin" />}
            {t("updatePassword")}
          </Button>
          <Link
            className="text-sm font-medium text-[rgb(var(--m-accent))] underline underline-offset-4"
            href="/forgot-password"
          >
            {t("forgotYourPassword")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
