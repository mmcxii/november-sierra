"use client";

import { useApiKey } from "@/components/marketing/docs/api-key-provider";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { maskApiKey } from "../constants";

export const ApiKeyInput: React.FC = () => {
  const { t } = useTranslation();
  const { apiKey, clearApiKey, setApiKey } = useApiKey();
  const [isEditing, setIsEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const maskedKey = maskApiKey(apiKey);

  const handleEdit = React.useCallback(() => {
    setIsEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setApiKey(e.target.value);
    },
    [setApiKey],
  );

  const handleBlur = React.useCallback(() => {
    if (maskedKey != null) {
      setIsEditing(false);
    }
  }, [maskedKey]);

  if (maskedKey != null && !isEditing) {
    return (
      <div
        className="m-card-bg-bg m-card-border flex items-center gap-3 rounded-lg border p-3"
        data-testid="api-key-display"
      >
        <code className="font-mono text-sm">{maskedKey}</code>
        <button
          className="m-muted-50 text-xs underline transition-colors hover:text-white"
          onClick={handleEdit}
          type="button"
        >
          {t("change")}
        </button>
        <button
          className="text-xs text-red-400 underline transition-colors hover:text-red-300"
          onClick={clearApiKey}
          type="button"
        >
          {t("clear")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3" data-testid="api-key-form">
      <input
        className="m-card-bg-bg m-card-border flex-1 rounded-lg border px-4 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-white/20"
        onBlur={handleBlur}
        onChange={handleChange}
        placeholder="anc_k_..."
        ref={inputRef}
        type="text"
        value={apiKey}
      />
    </div>
  );
};
