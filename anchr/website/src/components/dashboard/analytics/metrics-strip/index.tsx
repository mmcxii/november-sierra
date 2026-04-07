import { initTranslations } from "@/lib/i18n/server";
import * as React from "react";
import { TrendBadge } from "./trend-badge";

export type MetricsStripProps = {
  topCountry: null | string;
  topLinkTitle: null | string;
  totalClicks: number;
  trendPercent: null | number;
};

export const MetricsStrip: React.FC<MetricsStripProps> = async (props) => {
  const { topCountry, topLinkTitle, totalClicks, trendPercent } = props;

  //* Variables
  const { t } = await initTranslations();

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-3xl font-bold tabular-nums">{totalClicks.toLocaleString()}</p>
          {trendPercent != null && <TrendBadge value={trendPercent} />}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">{t("totalClicks")}</p>
      </div>
      <div>
        <p className="truncate text-3xl font-bold">{topLinkTitle ?? "—"}</p>
        <p className="text-muted-foreground mt-1 text-sm">{t("topLink")}</p>
      </div>
      <div>
        <p className="truncate text-3xl font-bold">{topCountry ?? "—"}</p>
        <p className="text-muted-foreground mt-1 text-sm">{t("topCountry")}</p>
      </div>
    </div>
  );
};
