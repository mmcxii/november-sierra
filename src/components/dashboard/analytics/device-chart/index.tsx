"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, DEVICE_KEYS, LEGEND_BG_CLASSES } from "./constants";

export type DeviceChartProps = {
  data: { count: number; device: null | string }[];
};

export const DeviceChart: React.FC<DeviceChartProps> = (props) => {
  const { data } = props;

  const { t } = useTranslation();

  const chartData = data.map((d) => ({
    name: t(DEVICE_KEYS[d.device ?? "desktop"] ?? "desktop"),
    value: d.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t("deviceBreakdown")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer height={200} width="100%">
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={chartData}
              dataKey="value"
              innerRadius={50}
              nameKey="name"
              outerRadius={80}
              paddingAngle={2}
              strokeWidth={0}
            >
              {chartData.map((_entry, index) => (
                <Cell fill={CHART_COLORS[index % CHART_COLORS.length]} key={index} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                color: "var(--color-popover-foreground)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex justify-center gap-4">
          {chartData.map((entry, index) => (
            <div className="flex items-center gap-1.5 text-xs" key={entry.name}>
              <div className={cn("size-2.5 rounded-full", LEGEND_BG_CLASSES[index % LEGEND_BG_CLASSES.length])} />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
