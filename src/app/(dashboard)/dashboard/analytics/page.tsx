import { ClicksChart } from "@/components/dashboard/analytics/clicks-chart";
import { EmptyState } from "@/components/dashboard/analytics/empty-state";
import { type LinkPerformanceRow, LinkPerformanceTable } from "@/components/dashboard/analytics/link-performance-table";
import { MetricsStrip } from "@/components/dashboard/analytics/metrics-strip";
import { requireUser } from "@/lib/auth";
import {
  type DateRange,
  getAnalyticsSummary,
  getClickHistory,
  getPerLinkSparklines,
  getPerLinkTrends,
  getPreviousPeriodClicks,
  getTopLinks,
} from "@/lib/db/queries/analytics";
import { initTranslations } from "@/lib/i18n/server";
import { computeTrendPercent, fillDateGaps } from "@/lib/utils/analytics";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Analytics",
};

type AnalyticsPageProps = {
  searchParams: Promise<{ range?: string }>;
};

const VALID_RANGES = new Set<DateRange>(["7d", "30d", "all"]);

const AnalyticsPage: React.FC<AnalyticsPageProps> = async (props) => {
  const { searchParams } = props;
  const user = await requireUser();
  const { t } = await initTranslations();
  const params = await searchParams;
  const range: DateRange = VALID_RANGES.has(params.range as DateRange) ? (params.range as DateRange) : "7d";
  const isAllTime = range === "all";

  const [summary, clickHistory, topLinks, previousPeriod, sparklineRows, perLinkTrends] = await Promise.all([
    getAnalyticsSummary(user.id, range),
    getClickHistory(user.id, range),
    getTopLinks(user.id, range),
    isAllTime ? Promise.resolve({ totalClicks: 0 }) : getPreviousPeriodClicks(user.id, range),
    getPerLinkSparklines(user.id),
    isAllTime ? Promise.resolve([]) : getPerLinkTrends(user.id, range),
  ]);

  if (summary.totalClicks === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">{t("analytics")}</h1>
        <EmptyState />
      </div>
    );
  }

  const overallTrend = isAllTime ? null : computeTrendPercent(summary.totalClicks, previousPeriod.totalClicks);

  const sparklineMap = new Map<string, { clicks: number; date: string }[]>();
  for (const row of sparklineRows) {
    const existing = sparklineMap.get(row.linkId);
    if (existing != null) {
      existing.push({ clicks: row.clicks, date: row.date });
    } else {
      sparklineMap.set(row.linkId, [{ clicks: row.clicks, date: row.date }]);
    }
  }

  const trendMap = new Map<string, number>();
  for (const row of perLinkTrends) {
    trendMap.set(row.linkId, computeTrendPercent(Number(row.clicks), Number(row.previousClicks)));
  }

  const linkPerformance: LinkPerformanceRow[] = topLinks.map((link) => ({
    clicks: link.clicks,
    linkId: link.linkId,
    slug: link.slug,
    sparklineData: fillDateGaps(sparklineMap.get(link.linkId) ?? [], 7),
    title: link.title,
    trendPercent: isAllTime ? null : (trendMap.get(link.linkId) ?? null),
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("analytics")}</h1>

      <div className="flex flex-col gap-6">
        <MetricsStrip
          topCountry={summary.topCountry}
          topLinkTitle={summary.topLinkTitle}
          totalClicks={summary.totalClicks}
          trendPercent={overallTrend}
        />

        <ClicksChart data={clickHistory} />

        {linkPerformance.length > 0 && <LinkPerformanceTable links={linkPerformance} />}
      </div>
    </div>
  );
};

export default AnalyticsPage;
