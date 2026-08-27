"use client";

import { Label } from "@/components/ui/label";
import { createApiKeyAction, revokeApiKeyAction } from "@/lib/actions/api-keys";
import { formatMaskedKey, isValidApiKeyName, mcpClientConfig } from "@/lib/api-keys";
import type { TranslationKey } from "@/lib/i18n/i18next";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type ApiKeyListItem = {
  createdAt: string;
  id: string;
  keyPrefix: string;
  keySuffix: string;
  lastUsedAt: null | string;
  name: string;
};

export type ApiKeysSectionProps = {
  keys: readonly ApiKeyListItem[];
  mcpUrl: string;
};

export const ApiKeysSection: React.FC<ApiKeysSectionProps> = (props) => {
  const { keys, mcpUrl } = props;

  //* State
  const { t } = useTranslation();
  const [isPending, startTransition] = React.useTransition();
  const [name, setName] = React.useState("");
  const [rawKey, setRawKey] = React.useState<null | string>(null);
  const [error, setError] = React.useState<null | TranslationKey>(null);

  //* Variables
  const configPreview = mcpClientConfig(mcpUrl, rawKey ?? "sf_k_YOUR_KEY");

  //* Handlers
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setError(null);
  };

  const onCreate = () => {
    const trimmed = name.trim();
    if (!isValidApiKeyName(trimmed)) {
      setError("invalidApiKeyNameUseLettersNumbersSpacesHyphensOrUnderscoresMax64Characters");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createApiKeyAction(trimmed);
      if ("error" in result) {
        setError(result.error as TranslationKey);
        return;
      }
      setRawKey(result.rawKey);
      setName("");
      toast.success(t("copyThisKeyNowWeCantShowItAgain"));
    });
  };

  const copyRawKey = () => {
    if (rawKey == null) {
      return;
    }
    void navigator.clipboard.writeText(rawKey);
    toast.success(t("apiKeyCopied"));
  };

  const copyConfig = () => {
    void navigator.clipboard.writeText(configPreview);
    toast.success(t("mcpConfigCopied"));
  };

  const onRevoke = (keyId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await revokeApiKeyAction(keyId);
      if ("error" in result) {
        setError(result.error as TranslationKey);
      }
    });
  };

  return (
    <section className="border-sf-border mt-10 w-full space-y-4 border-t pt-8">
      <h2 className="text-sf-muted text-xs font-medium tracking-[0.14em] uppercase">{t("aiAgents")}</h2>
      <p className="text-sf-muted text-sm">
        {t("connectCursorClaudeOrOtherMcpClientsToCheckTasksAndReadYourTeamBoard")}
      </p>
      <p className="font-mono text-xs break-all">{mcpUrl}</p>
      <button
        className="border-sf-border rounded-[var(--sf-radius)] border px-3 py-2 text-sm"
        onClick={copyConfig}
        type="button"
      >
        {t("copyMcpConfig")}
      </button>
      <pre className="border-sf-border bg-sf-elevated overflow-x-auto rounded-[var(--sf-radius)] border p-3 font-mono text-xs whitespace-pre">
        {configPreview}
      </pre>

      <div className="w-full space-y-1.5">
        <Label htmlFor="apiKeyName">{t("keyName")}</Label>
        <input
          className="border-sf-border bg-sf-elevated block w-full rounded-[var(--sf-radius)] border px-3 py-2"
          id="apiKeyName"
          maxLength={64}
          onChange={onNameChange}
          value={name}
        />
      </div>
      <button
        className="border-sf-border w-full rounded-[var(--sf-radius)] border px-4 py-3 text-sm disabled:opacity-60"
        disabled={isPending}
        onClick={onCreate}
        type="button"
      >
        {t("createKey")}
      </button>

      {rawKey != null ? (
        <div className="border-sf-border space-y-2 rounded-[var(--sf-radius)] border p-3">
          <p className="text-sf-muted text-xs">{t("copyThisKeyNowWeCantShowItAgain")}</p>
          <p className="font-mono text-sm break-all">{rawKey}</p>
          <button
            className="bg-sf-accent text-sf-accent-text rounded-[var(--sf-radius)] px-3 py-2 text-sm"
            onClick={copyRawKey}
            type="button"
          >
            {t("copyApiKey")}
          </button>
        </div>
      ) : null}

      {keys.length > 0 ? (
        <ul className="divide-sf-border divide-y">
          {keys.map((key) => {
            const handleButtonOnClick = () => {
              onRevoke(key.id);
            };

            return (
              <li className="flex items-center justify-between gap-3 py-3 text-sm" key={key.id}>
                <div className="min-w-0">
                  <p className="font-medium">{key.name}</p>
                  <p className="text-sf-muted font-mono text-xs">{formatMaskedKey(key.keyPrefix, key.keySuffix)}</p>
                  <p className="text-sf-muted text-xs">
                    {key.lastUsedAt != null
                      ? t("lastUsed{{date}}", { date: key.lastUsedAt.slice(0, 10) })
                      : t("neverUsed")}
                  </p>
                </div>
                <button
                  className="text-sf-danger text-sm underline disabled:opacity-60"
                  disabled={isPending}
                  onClick={handleButtonOnClick}
                  type="button"
                >
                  {t("revoke")}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {error != null ? <p className="text-sf-danger text-sm">{t(error)}</p> : null}
    </section>
  );
};
