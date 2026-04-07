"use client";

import { revokeApiKey } from "@/app/(dashboard)/dashboard/api/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TranslationKey } from "@/lib/i18n/i18next.d";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type RevokeKeyDialogProps = {
  keyId: null | string;
  keyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const RevokeKeyDialog: React.FC<RevokeKeyDialogProps> = (props) => {
  const { keyId, keyName, onOpenChange, open } = props;

  const { t } = useTranslation();
  const [isRevoking, setIsRevoking] = React.useState(false);

  const handleRevoke = async () => {
    if (keyId == null) {
      return;
    }

    setIsRevoking(true);
    const result = await revokeApiKey(keyId);
    setIsRevoking(false);

    if (!result.success) {
      toast.error(t((result.error ?? "somethingWentWrongPleaseTryAgain") as TranslationKey));
      return;
    }

    toast.success(t("apiKeyRevoked"));
    onOpenChange(false);
  };

  const handleButtonOnClick = () => onOpenChange(false);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("revokeApiKey")}</DialogTitle>
          <DialogDescription>
            {t("areYouSureYouWantToRevokeThe{{name}}ApiKeyThisActionCannotBeUndone", { name: keyName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled={isRevoking} onClick={handleButtonOnClick} variant="secondary">
            {t("cancel")}
          </Button>
          <Button disabled={isRevoking} onClick={handleRevoke} variant="tertiary">
            {isRevoking && <Loader2 className="size-3.5 animate-spin" />}
            {t("revoke")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
