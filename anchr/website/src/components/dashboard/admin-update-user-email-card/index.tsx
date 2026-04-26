"use client";

import { updateUserEmail } from "@/app/(dashboard)/dashboard/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// Last-resort recovery for users who lost both email access AND their
// recovery codes. Out-of-band identity verification (payment-method last-4
// for paid users; profile details for free) happens in the support
// conversation; the operator then drops the verified user id + new email
// here. The action flips ba_user.email + emailVerified=false so the new
// owner has to prove inbox access on next sign-in.
export const AdminUpdateUserEmailCard: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const [targetUserId, setTargetUserId] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [confirmEmail, setConfirmEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);

  //* Variables
  const submitDisabled =
    pending ||
    targetUserId.trim().length === 0 ||
    newEmail.trim().length === 0 ||
    confirmEmail.trim().length === 0 ||
    newEmail.trim().toLowerCase() !== confirmEmail.trim().toLowerCase();

  //* Handlers
  const handleTargetUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => setTargetUserId(e.target.value);
  const handleNewEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value);
  const handleConfirmEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setConfirmEmail(e.target.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const result = await updateUserEmail({
        confirmEmail: confirmEmail.trim(),
        newEmail: newEmail.trim(),
        targetUserId: targetUserId.trim(),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(t("emailUpdated"));
      setTargetUserId("");
      setNewEmail("");
      setConfirmEmail("");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("updateUserEmail")}</CardTitle>
        <CardDescription>{t("lastResortRecoveryWhenAUserHasLostBothEmailAndRecoveryCodes")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="targetUserId">{t("targetUserId")}</Label>
            <Input
              autoComplete="off"
              disabled={pending}
              id="targetUserId"
              onChange={handleTargetUserIdChange}
              placeholder="user_…"
              value={targetUserId}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="newEmail">{t("newEmail")}</Label>
            <Input
              autoComplete="off"
              disabled={pending}
              id="newEmail"
              onChange={handleNewEmailChange}
              placeholder="user@example.com"
              type="email"
              value={newEmail}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmEmail">{t("confirmEmail")}</Label>
            <Input
              autoComplete="off"
              disabled={pending}
              id="confirmEmail"
              onChange={handleConfirmEmailChange}
              placeholder="user@example.com"
              type="email"
              value={confirmEmail}
            />
          </div>
          <Button disabled={submitDisabled} type="submit">
            {pending && <Loader2 className="size-3.5 animate-spin" />}
            {t("updateEmail")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
