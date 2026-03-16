"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { LinkSparkline } from "../link-sparkline";
import { TrendText } from "./trend-text";

export type LinkPerformanceRow = {
  clicks: number;
  linkId: string;
  slug: string;
  sparklineData: { clicks: number; date: string }[];
  title: string;
  trendPercent: null | number;
};

export type LinkPerformanceTableProps = {
  links: LinkPerformanceRow[];
};

export const LinkPerformanceTable: React.FC<LinkPerformanceTableProps> = (props) => {
  const { links } = props;

  //* State
  const { t } = useTranslation();

  //* Variables
  const showTrend = links.some((link) => link.trendPercent != null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t("linkPerformance")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="pr-3 pb-2 font-medium">#</th>
                <th className="pr-3 pb-2 font-medium">{t("title")}</th>
                <th className="pr-3 pb-2 font-medium" />
                <th className="pr-3 pb-2 text-right font-medium">{t("clicks")}</th>
                {showTrend && <th className="pb-2 text-right font-medium">{t("trend")}</th>}
              </tr>
            </thead>
            <tbody>
              {links.map((link, index) => (
                <tr className="border-b last:border-0" key={link.linkId}>
                  <td className="text-muted-foreground py-2.5 pr-3 tabular-nums">{index + 1}</td>
                  <td className="max-w-48 truncate py-2.5 pr-3 font-medium">{link.title}</td>
                  <td className="py-2.5 pr-3">
                    <LinkSparkline data={link.sparklineData} />
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{link.clicks.toLocaleString()}</td>
                  {showTrend && (
                    <td className="py-2.5 text-right tabular-nums">
                      <TrendText value={link.trendPercent} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
