"use client";

import { type ConfirmImportResult, dismissAlert } from "@/app/(dashboard)/dashboard/import-actions";
import { ImportLinks } from "@/components/dashboard/import-links";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type ImportBannerProps = {
  onImportComplete?: (result: ConfirmImportResult & { success: true }) => void;
};

export const ImportBanner: React.FC<ImportBannerProps> = (props) => {
  const { onImportComplete } = props;

  //* State
  const { t } = useTranslation();
  const [dismissed, setDismissed] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  //* Handlers
  const handleDismiss = async () => {
    setDismissed(true);
    await dismissAlert("import");
  };

  const handleImportComplete = (result: ConfirmImportResult & { success: true }) => {
    setDismissed(true);
    void dismissAlert("import");
    onImportComplete?.(result);
  };

  const handleButtonOnClick = () => {
    setExpanded(true);
  };

  if (dismissed) {
    return null;
  }

  //* Render
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-dashed p-4">
      {!expanded ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Download className="text-muted-foreground size-4 shrink-0" />
            <p className="text-muted-foreground text-sm">{t("switchingFromAnotherPlatformImportYourLinks")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button onClick={handleButtonOnClick} size="sm" type="button" variant="secondary">
              {t("import")}
            </Button>
            <Button onClick={handleDismiss} size="sm" type="button" variant="tertiary">
              <X className="size-4" />
              <span className="sr-only">{t("dismiss")}</span>
            </Button>
          </div>
        </div>
      ) : (
        <ImportLinks onComplete={handleImportComplete} />
      )}
    </div>
  );
};
