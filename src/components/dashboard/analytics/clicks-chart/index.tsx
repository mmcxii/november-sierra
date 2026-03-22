"use client";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DateRangeSelect } from "../date-range-select";

export type ClicksChartProps = {
  data: { clicks: number; date: string }[];
  isPro: boolean;
};

export const ClicksChart: React.FC<ClicksChartProps> = (props) => {
  const { data, isPro } = props;

  //* State
  const { t } = useTranslation();

  //* Handlers
  const handleXAxisTickFormatter = (v: string) => {
    const d = new Date(v + "T00:00:00");
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  const handleTooltipLabelFormatter = (v: number | string) => {
    const d = new Date(String(v) + "T00:00:00");
    return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t("clicksOverTime")}</CardTitle>
        <CardAction>
          <DateRangeSelect isPro={isPro} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer height={300} width="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="clicksFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              fontSize={12}
              tickFormatter={handleXAxisTickFormatter}
              tickLine={false}
            />
            <YAxis allowDecimals={false} axisLine={false} fontSize={12} tickLine={false} width={30} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                color: "var(--color-popover-foreground)",
              }}
              labelFormatter={handleTooltipLabelFormatter}
            />
            <Area
              dataKey="clicks"
              fill="url(#clicksFill)"
              fillOpacity={1}
              stroke="var(--color-primary)"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
