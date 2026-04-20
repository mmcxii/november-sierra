"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import * as React from "react";
import { useTranslation } from "react-i18next";

type RecoveryCodesDisplayProps = {
  codes: string[];
  onClose?: () => void;
};

// Displays one-time recovery codes with copy and download affordances.
// Codes are shown exactly once — the parent must make sure it does not
// re-fetch or re-render the same code set.
export const RecoveryCodesDisplay: React.FC<RecoveryCodesDisplayProps> = (props) => {
  const { codes, onClose } = props;

  //* State
  const { t } = useTranslation();

  //* Handlers
  const handleCopy = async () => {
    await navigator.clipboard.writeText(codes.join("\n"));
  };

  const handleDownload = () => {
    const blob = new Blob([codes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anchr-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (win == null) {
      return;
    }
    win.document.write(`<pre style="font-family: ui-monospace, monospace; font-size: 16px;">${codes.join("\n")}</pre>`);
    win.print();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("saveYourRecoveryCodes")}</CardTitle>
        <CardDescription>
          {t(
            "treatTheseLikeASecondPasswordAnyoneWithOneOfTheseCodesCanRegainAccessToYourAccountPrintThemOrStoreThemInAPasswordManagerDoNotStoreThemInCloudNotesOrScreenshotsSyncedToADeviceYouAlsoSignInWith",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="grid grid-cols-2 gap-2 rounded bg-[var(--m-embed-bg)] p-4 font-mono text-sm">
          {codes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCopy} type="button" variant="secondary">
            {t("copy")}
          </Button>
          <Button onClick={handleDownload} type="button" variant="secondary">
            {t("download")}
          </Button>
          <Button onClick={handlePrint} type="button" variant="secondary">
            {t("print")}
          </Button>
          {onClose != null && (
            <Button onClick={onClose} type="button">
              {t("iveSavedTheseCodes")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
