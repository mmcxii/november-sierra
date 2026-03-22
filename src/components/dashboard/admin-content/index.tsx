"use client";

import { createAdminCode, deactivateAdminCode, reactivateAdminCode } from "@/app/(dashboard)/dashboard/admin/actions";
import { StatusBadge } from "@/components/dashboard/admin-content/status-badge";
import { getCodeStatus } from "@/components/dashboard/admin-content/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Copy, Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type Redemption = {
  createdAt: Date;
  username: string;
};

type ReferralCode = {
  active: boolean;
  code: string;
  createdAt: Date;
  currentRedemptions: number;
  durationDays: null | number;
  expiresAt: null | Date;
  id: string;
  maxRedemptions: null | number;
  note: null | string;
  redemptions: Redemption[];
};

export type AdminContentProps = {
  codes: ReferralCode[];
};

export const AdminContent: React.FC<AdminContentProps> = (props) => {
  const { codes } = props;

  const { t } = useTranslation();
  const [noteInput, setNoteInput] = React.useState("");
  const [durationInput, setDurationInput] = React.useState("");
  const [isPermanent, setIsPermanent] = React.useState(false);
  const [maxRedemptionsInput, setMaxRedemptionsInput] = React.useState("");
  const [expiresAtInput, setExpiresAtInput] = React.useState("");
  const [createPending, startCreateTransition] = React.useTransition();
  const [actionPendingId, setActionPendingId] = React.useState<null | string>(null);
  const [expandedId, setExpandedId] = React.useState<null | string>(null);

  //* Handlers
  const handleCreate = () => {
    startCreateTransition(async () => {
      const result = await createAdminCode({
        durationDays: isPermanent ? null : durationInput !== "" ? Number(durationInput) : null,
        expiresAt: expiresAtInput !== "" ? expiresAtInput : null,
        maxRedemptions: maxRedemptionsInput !== "" ? Number(maxRedemptionsInput) : null,
        note: noteInput !== "" ? noteInput : null,
      });

      if (!result.success) {
        toast.error(t(result.error));
        return;
      }

      setNoteInput("");
      setDurationInput("");
      setIsPermanent(false);
      setMaxRedemptionsInput("");
      setExpiresAtInput("");
      toast.success(t("referralCodeCreated"));
    });
  };

  const handleToggleActive = (code: ReferralCode, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionPendingId(code.id);

    const action = code.active ? deactivateAdminCode : reactivateAdminCode;
    const toastKey = code.active ? "referralCodeDeactivated" : "referralCodeReactivated";

    action(code.id)
      .then((result) => {
        if (!result.success) {
          toast.error(t(result.error));
          return;
        }
        toast.success(t(toastKey));
      })
      .finally(() => setActionPendingId(null));
  };

  const handleCopyCode = (codeValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeValue);
    toast.success(t("referralCodeCopied"));
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleNoteInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setNoteInput(e.target.value);
  const handleDurationInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setDurationInput(e.target.value);
  const handlePermanentOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setIsPermanent(e.target.checked);
  const handleMaxRedemptionsInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setMaxRedemptionsInput(e.target.value);
  const handleExpiresAtInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setExpiresAtInput(e.target.value);

  return (
    <div className="space-y-6">
      {/* Create Code Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t("createReferralCode")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground mb-2 text-sm font-medium">{t("note")}</p>
            <Input disabled={createPending} onChange={handleNoteInputOnChange} value={noteInput} />
          </div>
          <div>
            <p className="text-muted-foreground mb-2 text-sm font-medium">{t("duration")}</p>
            <div className="flex items-center gap-3">
              <Input
                disabled={createPending || isPermanent}
                onChange={handleDurationInputOnChange}
                placeholder={t("{{count}}Days", { count: 30 })}
                type="number"
                value={isPermanent ? "" : durationInput}
              />
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <input
                  checked={isPermanent}
                  disabled={createPending}
                  onChange={handlePermanentOnChange}
                  type="checkbox"
                />
                {t("permanent")}
              </label>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-2 text-sm font-medium">{t("maxRedemptions")}</p>
            <Input
              disabled={createPending}
              onChange={handleMaxRedemptionsInputOnChange}
              placeholder={t("unlimited")}
              type="number"
              value={maxRedemptionsInput}
            />
          </div>
          <div>
            <p className="text-muted-foreground mb-2 text-sm font-medium">{t("expires")}</p>
            <Input
              disabled={createPending}
              onChange={handleExpiresAtInputOnChange}
              type="date"
              value={expiresAtInput}
            />
          </div>
          <Button disabled={createPending} onClick={handleCreate}>
            {createPending && <Loader2 className="size-3.5 animate-spin" />}
            {t("createReferralCode")}
          </Button>
        </CardContent>
      </Card>

      {/* Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("referralCodes")}</CardTitle>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noReferralCodesYet")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="pr-4 pb-2 text-left font-medium" />
                    {/* eslint-disable-next-line anchr/no-raw-string-jsx -- table column header matching data field */}
                    <th className="pr-4 pb-2 text-left font-medium">Code</th>
                    <th className="pr-4 pb-2 text-left font-medium">{t("note")}</th>
                    {/* eslint-disable-next-line anchr/no-raw-string-jsx -- table column header matching data field */}
                    <th className="pr-4 pb-2 text-left font-medium">Status</th>
                    <th className="pr-4 pb-2 text-left font-medium">{t("uses")}</th>
                    <th className="pr-4 pb-2 text-left font-medium">{t("duration")}</th>
                    <th className="pr-4 pb-2 text-left font-medium">{t("expires")}</th>
                    {/* eslint-disable-next-line anchr/no-raw-string-jsx -- table column header matching data field */}
                    <th className="pr-4 pb-2 text-left font-medium">Created</th>
                    <th className="pb-2 text-left font-medium">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => {
                    const status = getCodeStatus(code);
                    const isExpanded = expandedId === code.id;
                    const handleRowClick = () => handleToggleExpand(code.id);
                    const handleCopyClick = (e: React.MouseEvent) => handleCopyCode(code.code, e);
                    const handleToggleClick = (e: React.MouseEvent) => handleToggleActive(code, e);

                    return (
                      <React.Fragment key={code.id}>
                        <tr
                          className="hover:bg-muted/50 cursor-pointer border-b transition-colors last:border-0"
                          onClick={handleRowClick}
                        >
                          <td className="py-3 pr-2">
                            {isExpanded ? (
                              <ChevronDown className="text-muted-foreground size-4" />
                            ) : (
                              <ChevronRight className="text-muted-foreground size-4" />
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-1.5">
                              <code className="bg-muted rounded px-2 py-0.5 font-mono text-xs">{code.code}</code>
                              <IconButton onClick={handleCopyClick}>
                                <Copy className="size-3" />
                              </IconButton>
                            </div>
                          </td>
                          <td className="text-muted-foreground max-w-[200px] truncate py-3 pr-4">{code.note ?? "—"}</td>
                          <td className="py-3 pr-4">
                            <StatusBadge status={status} />
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs">
                            {code.currentRedemptions} / {code.maxRedemptions ?? "∞"}
                          </td>
                          <td className="py-3 pr-4">
                            {code.durationDays != null
                              ? t("{{count}}Days", { count: code.durationDays })
                              : t("permanent")}
                          </td>
                          <td className="py-3 pr-4">
                            {code.expiresAt != null ? code.expiresAt.toLocaleDateString() : t("never")}
                          </td>
                          <td className="py-3 pr-4">{code.createdAt.toLocaleDateString()}</td>
                          <td className="py-3">
                            <Button
                              disabled={actionPendingId === code.id}
                              onClick={handleToggleClick}
                              variant="tertiary"
                            >
                              {actionPendingId === code.id && <Loader2 className="size-3 animate-spin" />}
                              {code.active ? t("deactivate") : t("reactivate")}
                            </Button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td className="bg-muted/30 px-8 py-3" colSpan={9}>
                              {code.redemptions.length === 0 ? (
                                <p className="text-muted-foreground text-xs italic">{t("noRedemptionsYet")}</p>
                              ) : (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-muted-foreground">
                                      <th className="pb-1 text-left font-medium">{t("username")}</th>
                                      <th className="pb-1 text-left font-medium">{t("redeemedAt")}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {code.redemptions.map((redemption) => (
                                      <tr key={`${code.id}-${redemption.username}`}>
                                        {/* eslint-disable-next-line anchr/no-raw-string-jsx -- dynamic username with @ prefix */}
                                        <td className="py-1">@{redemption.username}</td>
                                        <td className="py-1">{redemption.createdAt.toLocaleDateString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
