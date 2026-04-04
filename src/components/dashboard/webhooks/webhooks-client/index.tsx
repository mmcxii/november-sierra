"use client";

import { sendTestWebhookAction, updateWebhookAction } from "@/app/(dashboard)/dashboard/api/webhook-actions";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, RefreshCw, Send, Settings, Trash2, Webhook } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CreateWebhookDialog } from "../create-webhook-dialog";
import { DeleteWebhookDialog } from "../delete-webhook-dialog";
import { DeliveryLogDialog } from "../delivery-log-dialog";
import { EditWebhookDialog } from "../edit-webhook-dialog";

export type WebhookRow = {
  active: boolean;
  consecutiveFailures: number;
  createdAt: string;
  events: string[];
  id: string;
  url: string;
};

export type WebhooksClientProps = {
  webhooks: WebhookRow[];
};

export const WebhooksClient: React.FC<WebhooksClientProps> = (props) => {
  const { webhooks } = props;

  const { t } = useTranslation();

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<null | WebhookRow>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<null | WebhookRow>(null);
  const [deliveryTarget, setDeliveryTarget] = React.useState<null | WebhookRow>(null);
  const [testingId, setTestingId] = React.useState<null | string>(null);
  const [reenablingId, setReenablingId] = React.useState<null | string>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleTest = async (webhook: WebhookRow) => {
    setTestingId(webhook.id);
    try {
      await sendTestWebhookAction(webhook.id);
      toast.success(t("testEventSent"));
    } catch {
      toast.error(t("somethingWentWrongPleaseTryAgain"));
    }
    setTestingId(null);
  };

  const handleReEnable = async (webhook: WebhookRow) => {
    setReenablingId(webhook.id);
    try {
      await updateWebhookAction(webhook.id, { active: true });
      toast.success(t("webhookReEnabled"));
    } catch {
      toast.error(t("somethingWentWrongPleaseTryAgain"));
    }
    setReenablingId(null);
  };

  const handleButtonOnClick = () => setCreateDialogOpen(true);

  const handleEditWebhookDialogOnOpenChange = (open: boolean) => {
    if (!open) {
      setEditTarget(null);
    }
  };

  const handleDeleteWebhookDialogOnOpenChange = (open: boolean) => {
    if (!open) {
      setDeleteTarget(null);
    }
  };

  const handleDeliveryLogDialogOnOpenChange = (open: boolean) => {
    if (!open) {
      setDeliveryTarget(null);
    }
  };

  return (
    <>
      {webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="bg-muted flex size-16 items-center justify-center rounded-full">
            <Webhook className="text-muted-foreground size-8" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">{t("noWebhooksYet")}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{t("createAWebhookToReceiveEventNotifications")}</p>
          </div>
          <Button onClick={handleButtonOnClick}>
            <Plus className="size-3.5" />
            {t("createWebhook")}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-end">
            <Button onClick={handleButtonOnClick} size="sm">
              <Plus className="size-3.5" />
              {t("createWebhook")}
            </Button>
          </div>

          <div className="border-border overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">{t("url")}</th>
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">{t("events")}</th>
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">{t("status")}</th>
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">{t("created")}</th>
                  <th className="text-muted-foreground px-4 py-3 text-right font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((webhook) => {
                  const handleReEnableClick = () => {
                    void handleReEnable(webhook);
                  };
                  const handleTestClick = () => {
                    void handleTest(webhook);
                  };
                  const handleDeliveryClick = () => {
                    setDeliveryTarget(webhook);
                  };
                  const handleEditClick = () => {
                    setEditTarget(webhook);
                  };
                  const handleDeleteClick = () => {
                    setDeleteTarget(webhook);
                  };

                  return (
                    <tr className="border-border border-b last:border-b-0" key={webhook.id}>
                      <td className="max-w-48 truncate px-4 py-3">
                        <code className="text-xs">{webhook.url}</code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground text-xs">
                          {webhook.events.length} {webhook.events.length === 1 ? t("event") : t("events")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {webhook.active ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                            {t("active")}
                          </span>
                        ) : (
                          <span className="text-destructive inline-flex items-center gap-1 text-xs">
                            <span className="bg-destructive inline-block size-1.5 rounded-full" />
                            {t("disabled")}
                          </span>
                        )}
                      </td>
                      <td className="text-muted-foreground px-4 py-3 text-xs">{formatDate(webhook.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!webhook.active && (
                            <Button
                              disabled={reenablingId === webhook.id}
                              onClick={handleReEnableClick}
                              size="sm"
                              variant="tertiary"
                            >
                              {reenablingId === webhook.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <RefreshCw className="size-3" />
                              )}
                              {t("reEnable")}
                            </Button>
                          )}
                          <Button
                            disabled={testingId === webhook.id}
                            onClick={handleTestClick}
                            size="sm"
                            variant="tertiary"
                          >
                            {testingId === webhook.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Send className="size-3" />
                            )}
                            {t("test")}
                          </Button>
                          <Button onClick={handleDeliveryClick} size="sm" variant="tertiary">
                            {t("log")}
                          </Button>
                          <Button onClick={handleEditClick} size="sm" variant="tertiary">
                            <Settings className="size-3" />
                          </Button>
                          <Button onClick={handleDeleteClick} size="sm" variant="tertiary">
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <CreateWebhookDialog onOpenChange={setCreateDialogOpen} open={createDialogOpen} />

      <EditWebhookDialog
        onOpenChange={handleEditWebhookDialogOnOpenChange}
        open={editTarget != null}
        webhook={editTarget}
      />

      <DeleteWebhookDialog
        onOpenChange={handleDeleteWebhookDialogOnOpenChange}
        open={deleteTarget != null}
        webhookId={deleteTarget?.id ?? null}
        webhookUrl={deleteTarget?.url ?? ""}
      />

      <DeliveryLogDialog
        onOpenChange={handleDeliveryLogDialogOnOpenChange}
        open={deliveryTarget != null}
        webhookId={deliveryTarget?.id ?? null}
        webhookUrl={deliveryTarget?.url ?? ""}
      />
    </>
  );
};
