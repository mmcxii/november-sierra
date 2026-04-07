"use client";

import { getWebhookDeliveries, type WebhookDeliveryRow } from "@/app/(dashboard)/dashboard/api/webhook-actions";
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

export type DeliveryLogDialogProps = {
  open: boolean;
  webhookId: null | string;
  webhookUrl: string;
  onOpenChange: (open: boolean) => void;
};

export const DeliveryLogDialog: React.FC<DeliveryLogDialogProps> = (props) => {
  const { onOpenChange, open, webhookId, webhookUrl } = props;

  const { t } = useTranslation();

  const [deliveries, setDeliveries] = React.useState<WebhookDeliveryRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && webhookId != null) {
      setIsLoading(true);
      void getWebhookDeliveries(webhookId)
        .then(setDeliveries)
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, webhookId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
    });
  };

  const handleButtonOnClick = () => onOpenChange(false);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("deliveryLog")}</DialogTitle>
          <DialogDescription className="break-all">
            <code className="text-xs">{webhookUrl}</code>
          </DialogDescription>
        </DialogHeader>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        )}
        {!isLoading && deliveries.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">{t("noDeliveriesYet")}</p>
        )}
        {!isLoading && deliveries.length > 0 && (
          <div className="border-border max-h-80 overflow-y-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t("event")}</th>
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t("status")}</th>
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t("attempt")}</th>
                  <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">{t("time")}</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr className="border-border border-b last:border-b-0" key={d.id}>
                    <td className="px-3 py-2">
                      <code className="text-xs">{d.event}</code>
                    </td>
                    <td className="px-3 py-2">
                      {d.success ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                          {d.statusCode}
                        </span>
                      ) : (
                        <span className="text-destructive inline-flex items-center gap-1 text-xs">
                          <span className="bg-destructive inline-block size-1.5 rounded-full" />
                          {d.statusCode ?? t("error")}
                        </span>
                      )}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 text-xs">
                      {t("{{attempt}}{{maxAttempts}}", { attempt: d.attempt, maxAttempts: 3 })}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 text-xs">{formatDate(d.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <DialogFooter>
          <Button onClick={handleButtonOnClick}>{t("close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
