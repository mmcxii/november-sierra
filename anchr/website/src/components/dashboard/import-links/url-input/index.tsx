"use client";

import { scrapeImportUrl, type ScrapeResult } from "@/app/(dashboard)/dashboard/import-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TranslationKey } from "@/lib/i18n/i18next";
import type { ImportedPage } from "@/lib/import/types";
import { Download, Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type ImportUrlInputProps = {
  onResult: (page: ImportedPage) => void;
};

export const ImportUrlInput: React.FC<ImportUrlInputProps> = (props) => {
  const { onResult } = props;

  //* State
  const { t } = useTranslation();
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  //* Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed.length === 0) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result: ScrapeResult = await scrapeImportUrl(trimmed);
      if (result.success) {
        onResult(result.page);
      } else {
        setError(t(result.error as TranslationKey));
      }
    } catch {
      setError(t("somethingWentWrongPleaseTryAgain"));
    } finally {
      setLoading(false);
    }
  };

  const handleInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  //* Render
  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            autoFocus
            disabled={loading}
            onChange={handleInputOnChange}
            placeholder="linktr.ee/username"
            type="text"
            value={url}
          />
          <Button disabled={loading || url.trim().length === 0} type="submit">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {t("import")}
          </Button>
        </div>
        {error.length > 0 && <p className="text-destructive text-sm">{error}</p>}
      </div>
    </form>
  );
};
