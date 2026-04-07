"use client";

import * as React from "react";
import { Area, AreaChart } from "recharts";

export type LinkSparklineProps = {
  data: { clicks: number; date: string }[];
};

export const LinkSparkline: React.FC<LinkSparklineProps> = (props) => {
  const { data } = props;

  return (
    <AreaChart data={data} height={24} width={80}>
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        dataKey="clicks"
        fill="url(#sparkFill)"
        fillOpacity={1}
        isAnimationActive={false}
        stroke="var(--color-primary)"
        strokeWidth={1.5}
        type="monotone"
      />
    </AreaChart>
  );
};
