"use client";

import { updateWebhookAction } from "@/app/(dashboard)/dashboard/api/webhook-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WEBHOOK_EVENTS, type WebhookEvent } from "@/lib/api/schemas/webhook";
import type { TranslationKey } from "@/lib/i18n/i18next.d";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import type { WebhookRow } from "../webhooks-client";

export type EditWebhookDialogProps = {
  open: boolean;
  webhook: null | WebhookRow;
  onOpenChange: (open: boolean) => void;
};

export const EditWebhookDialog: React.FC<EditWebhookDialogProps> = (props) => {
  const { onOpenChange, open, webhook } = props;

  const { t } = useTranslation();

  const [url, setUrl] = React.useState("");
  const [selectedEvents, setSelectedEvents] = React.useState<WebhookEvent[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<null | string>(null);

  React.useEffect(() => {
    if (webhook != null && open) {
      setUrl(webhook.url);
      setSelectedEvents(webhook.events as WebhookEvent[]);
      setError(null);
    }
  }, [webhook, open]);

  const handleEventToggle = (event: WebhookEvent) => {
    setSelectedEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]));
  };

  const handleSave = async () => {
    if (webhook == null) {
      return;
    }

    setError(null);
    setIsSaving(true);

    let result: Awaited<ReturnType<typeof updateWebhookAction>>;
    try {
      result = await updateWebhookAction(webhook.id, {
        events: selectedEvents,
        url: url.trim(),
      });
    } catch {
      setIsSaving(false);
      setError(t("somethingWentWrongPleaseTryAgain"));
      return;
    }

    setIsSaving(false);

    if (!result.success) {
      setError(t((result.error ?? "somethingWentWrongPleaseTryAgain") as TranslationKey));
      return;
    }

    onOpenChange(false);
  };

  const handleInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editWebhook")}</DialogTitle>
          <DialogDescription>{t("updateYourWebhookEndpointUrlOrEvents")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-webhook-url">{t("endpointUrl")}</Label>
            <Input autoFocus id="edit-webhook-url" onChange={handleInputOnChange} value={url} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("events")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map((event) => {
                const handleCheckedChange = () => {
                  handleEventToggle(event);
                };
                return (
                  <label className="flex items-center gap-2 text-sm" key={event}>
                    <Checkbox checked={selectedEvents.includes(event)} onCheckedChange={handleCheckedChange} />
                    <code className="text-xs">{event}</code>
                  </label>
                );
              })}
            </div>
          </div>
          {error != null && <p className="text-destructive text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button disabled={isSaving || url.trim().length === 0 || selectedEvents.length === 0} onClick={handleSave}>
            {isSaving && <Loader2 className="size-3.5 animate-spin" />}
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
