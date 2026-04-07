"use client";

import { deleteWebhookAction } from "@/app/(dashboard)/dashboard/api/webhook-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type DeleteWebhookDialogProps = {
  open: boolean;
  webhookId: null | string;
  webhookUrl: string;
  onOpenChange: (open: boolean) => void;
};

export const DeleteWebhookDialog: React.FC<DeleteWebhookDialogProps> = (props) => {
  const { onOpenChange, open, webhookId, webhookUrl } = props;

  const { t } = useTranslation();

  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (webhookId == null) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteWebhookAction(webhookId);
    } catch {
      // Error handled by revalidation
    }
    setIsDeleting(false);
    onOpenChange(false);
  };

  const handleButtonOnClick = () => onOpenChange(false);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteWebhook")}</DialogTitle>
          <DialogDescription>{t("areYouSureYouWantToDeleteThisWebhookThisActionCannotBeUndone")}</DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground text-sm break-all">
          <code>{webhookUrl}</code>
        </p>
        <DialogFooter>
          <Button onClick={handleButtonOnClick} variant="secondary">
            {t("cancel")}
          </Button>
          <Button disabled={isDeleting} onClick={handleDelete} variant="tertiary">
            {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
            {t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
