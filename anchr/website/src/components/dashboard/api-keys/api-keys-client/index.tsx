"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatMaskedKey } from "@/lib/api-keys";
import { Ban, KeyRound, Plus } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { CreateKeyDialog } from "../create-key-dialog";
import { RevokeKeyDialog } from "../revoke-key-dialog";

export type ApiKeyRow = {
  createdAt: string;
  id: string;
  keyPrefix: string;
  keySuffix: string;
  lastUsedAt: null | string;
  name: string;
  revokedAt: null | string;
};

export type ApiKeysClientProps = {
  keys: ApiKeyRow[];
};

export const ApiKeysClient: React.FC<ApiKeysClientProps> = (props) => {
  const { keys } = props;

  const { t } = useTranslation();
  const [showRevoked, setShowRevoked] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [revokeTarget, setRevokeTarget] = React.useState<null | { id: string; name: string }>(null);

  const filteredKeys = showRevoked ? keys : keys.filter((k) => k.revokedAt == null);
  const hasRevokedKeys = keys.some((k) => k.revokedAt != null);

  const handleCreateKeyButtonOnClick = () => setCreateDialogOpen(true);

  const handleRevokeDialogOpenChange = (open: boolean) => {
    if (!open) {
      setRevokeTarget(null);
    }
  };

  const handleRevokeButtonOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.dataset.keyId;
    const name = e.currentTarget.dataset.keyName;
    if (id != null && name != null) {
      setRevokeTarget({ id, name });
    }
  };

  const formatDate = (dateStr: null | string) => {
    if (dateStr == null) {
      return t("never");
    }
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      {keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="bg-muted flex size-16 items-center justify-center rounded-full">
            <KeyRound className="text-muted-foreground size-8" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">{t("noApiKeysYet")}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{t("createAnApiKeyToGetStarted")}</p>
          </div>
          <Button onClick={handleCreateKeyButtonOnClick}>
            <Plus className="size-3.5" />
            {t("createKey")}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasRevokedKeys && (
                <div className="flex items-center gap-2">
                  <Switch checked={showRevoked} id="show-revoked" onCheckedChange={setShowRevoked} />
                  <Label className="text-muted-foreground text-sm" htmlFor="show-revoked">
                    {t("showRevokedKeys")}
                  </Label>
                </div>
              )}
            </div>
            <Button onClick={handleCreateKeyButtonOnClick} size="sm">
              <Plus className="size-3.5" />
              {t("createKey")}
            </Button>
          </div>

          <div className="border-border overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">{t("name")}</th>
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">{t("key")}</th>
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">{t("status")}</th>
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">{t("created")}</th>
                  <th className="text-muted-foreground px-4 py-3 text-left font-medium">{t("lastUsed")}</th>
                  <th className="text-muted-foreground px-4 py-3 text-right font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map((key) => {
                  const isRevoked = key.revokedAt != null;

                  return (
                    <tr className="border-border border-b last:border-b-0" key={key.id}>
                      <td className="px-4 py-3 font-medium">{key.name}</td>
                      <td className="px-4 py-3">
                        <code className="text-muted-foreground text-xs">
                          {formatMaskedKey(key.keyPrefix, key.keySuffix)}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        {isRevoked ? (
                          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                            <span className="bg-muted-foreground/40 inline-block size-1.5 rounded-full" />
                            {t("revoked")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                            {t("active")}
                          </span>
                        )}
                      </td>
                      <td className="text-muted-foreground px-4 py-3 text-xs">{formatDate(key.createdAt)}</td>
                      <td className="text-muted-foreground px-4 py-3 text-xs">{formatDate(key.lastUsedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {!isRevoked && (
                          <Button
                            data-key-id={key.id}
                            data-key-name={key.name}
                            onClick={handleRevokeButtonOnClick}
                            size="sm"
                            variant="tertiary"
                          >
                            <Ban className="size-3" />
                            {t("revoke")}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredKeys.length === 0 && (
                  <tr>
                    <td className="text-muted-foreground px-4 py-8 text-center" colSpan={6}>
                      {showRevoked ? t("noApiKeysYet") : t("noActiveApiKeys")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <CreateKeyDialog onOpenChange={setCreateDialogOpen} open={createDialogOpen} />

      <RevokeKeyDialog
        keyId={revokeTarget?.id ?? null}
        keyName={revokeTarget?.name ?? ""}
        onOpenChange={handleRevokeDialogOpenChange}
        open={revokeTarget != null}
      />
    </>
  );
};
