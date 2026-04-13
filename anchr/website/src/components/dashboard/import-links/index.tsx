"use client";

import type { ConfirmImportResult } from "@/app/(dashboard)/dashboard/import-actions";
import type { ImportedPage } from "@/lib/import/types";
import * as React from "react";
import { ImportPreview } from "./import-preview";
import { ImportUrlInput } from "./url-input";

type ImportStep = "input" | "preview";

export type ImportLinksProps = {
  onComplete: (result: ConfirmImportResult & { success: true }) => void;
};

export const ImportLinks: React.FC<ImportLinksProps> = (props) => {
  const { onComplete } = props;

  //* State
  const [step, setStep] = React.useState<ImportStep>("input");
  const [page, setPage] = React.useState<null | ImportedPage>(null);

  //* Handlers
  const handleScrapeResult = (result: ImportedPage) => {
    setPage(result);
    setStep("preview");
  };

  const handleBack = () => {
    setStep("input");
    setPage(null);
  };

  //* Render

  if (step === "preview" && page != null) {
    return <ImportPreview onBack={handleBack} onComplete={onComplete} page={page} />;
  }

  return <ImportUrlInput onResult={handleScrapeResult} />;
};
