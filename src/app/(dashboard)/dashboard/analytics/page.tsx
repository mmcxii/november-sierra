import { ClicksChart } from "@/components/dashboard/analytics/clicks-chart";
import { DateRangeSelect } from "@/components/dashboard/analytics/date-range-select";
import { DeviceChart } from "@/components/dashboard/analytics/device-chart";
import { EmptyState } from "@/components/dashboard/analytics/empty-state";
import { LocationList } from "@/components/dashboard/analytics/location-list";
import { SummaryCards } from "@/components/dashboard/analytics/summary-cards";
import { TopLinksTable } from "@/components/dashboard/analytics/top-links-table";
import { requireUser } from "@/lib/auth";
import {
  type DateRange,
  getAnalyticsSummary,
  getClickHistory,
  getDeviceStats,
  getLocationStats,
  getTopLinks,
} from "@/lib/db/queries/analytics";
import { initTranslations } from "@/lib/i18n/server";
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

  const [summary, clickHistory, topLinks, deviceStats, locationStats] = await Promise.all([
    getAnalyticsSummary(user.id, range),
    getClickHistory(user.id, range),
    getTopLinks(user.id, range),
    getDeviceStats(user.id, range),
    getLocationStats(user.id, range),
  ]);

  if (summary.totalClicks === 0) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("analytics")}</h1>
          <DateRangeSelect />
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("analytics")}</h1>
        <DateRangeSelect />
      </div>

      <div className="flex flex-col gap-6">
        <SummaryCards
          topCountry={summary.topCountry}
          topLinkTitle={summary.topLinkTitle}
          totalClicks={summary.totalClicks}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ClicksChart data={clickHistory} />
          </div>
          <DeviceChart data={deviceStats} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TopLinksTable links={topLinks} />
          </div>
          <LocationList locations={locationStats} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
