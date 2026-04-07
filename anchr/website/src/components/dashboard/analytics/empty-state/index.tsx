import { initTranslations } from "@/lib/i18n/server";
import { BarChart3 } from "lucide-react";
import * as React from "react";

export const EmptyState: React.FC = async () => {
  const { t } = await initTranslations();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <div className="bg-muted flex size-16 items-center justify-center rounded-full">
        <BarChart3 className="text-muted-foreground size-8" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold">{t("noClickDataYet")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("clickDataWillAppearHereOnceVisitorsStartUsingYourLinks")}
        </p>
      </div>
    </div>
  );
};
