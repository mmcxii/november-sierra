import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "react-i18next";

export const CompleteStep: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <PartyPopper className="text-primary size-12" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("yourPageIsLive")}</h1>
        <p className="text-muted-foreground text-sm">{t("youreAllSetStartSharingYourPage")}</p>
      </div>

      <div className="flex w-full flex-col gap-2">
        <Button asChild className="w-full">
          <Link href="/dashboard">{t("goToDashboard")}</Link>
        </Button>
      </div>
    </div>
  );
};
