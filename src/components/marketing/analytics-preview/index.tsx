"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { CHART_AREA, CHART_LINE, DAYS, PEAK_IDX, TOP_LINKS } from "./constants";
import { ProgressBar } from "./progress-bar";

export const AnalyticsPreview: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = React.useState(false);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (el == null) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!triggered) {
      return;
    }

    const target = 2418;
    const duration = 1400;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * target));
      if (t < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [triggered]);

  return (
    <div className="mt-3 space-y-4" ref={ref}>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] leading-none font-bold tracking-tight tabular-nums">
            {count.toLocaleString()}
          </span>
          <span className="m-accent-color text-[11px] font-semibold">↑ 12%</span>
        </div>
        <p className="m-muted-40 mt-1 text-[10px] tracking-[0.06em]">clicks this week</p>
      </div>

      <div>
        <div className="relative">
          <svg className="h-[52px] w-full overflow-visible" preserveAspectRatio="none" viewBox="0 -10 280 58">
            <defs>
              <linearGradient id="tideGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--m-accent))" stopOpacity="0.22" />
                <stop offset="100%" stopColor="rgb(var(--m-accent))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line
              stroke="rgb(var(--m-muted) / 0.07)"
              strokeDasharray="3 5"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
              x1="0"
              x2="280"
              y1="16"
              y2="16"
            />
            <line
              stroke="rgb(var(--m-muted) / 0.07)"
              strokeDasharray="3 5"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
              x1="0"
              x2="280"
              y1="32"
              y2="32"
            />
            <path d={CHART_AREA} fill="url(#tideGrad)" />
            <path
              d={CHART_LINE}
              fill="none"
              stroke="rgb(var(--m-accent))"
              strokeLinecap="round"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Peak marker */}
          <div className="pointer-events-none absolute top-[9px] left-[66.67%] -translate-x-1/2 -translate-y-1/2">
            <div className="m-sonar-sm-28 absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full" />
            <div className="m-sonar-sm-22 absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full" />
            <div className="m-sonar-dot absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full" />
          </div>
        </div>

        <div className="mt-1.5 flex justify-between">
          {DAYS.map((day, i) => (
            <span
              className={cn("text-[9px] font-semibold", {
                "m-accent-color": i === PEAK_IDX,
                "m-muted-25": i !== PEAK_IDX,
              })}
              key={i}
            >
              {day}
            </span>
          ))}
        </div>
      </div>

      <div className="m-divider-bg h-px" />

      <div className="space-y-2.5">
        <p className="m-muted-28 text-[9px] font-semibold tracking-[0.18em] uppercase">Top links</p>
        {TOP_LINKS.map(({ clicks, label }, i) => (
          <div key={label}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="m-muted-60 truncate text-[11px]">{label}</span>
              <span className="m-muted-40 ml-2 shrink-0 text-[11px] font-semibold tabular-nums">
                {clicks.toLocaleString()}
              </span>
            </div>
            <div className="m-muted-bg-08 h-[2px] overflow-hidden rounded-full">
              <ProgressBar clicks={clicks} index={i} maxClicks={TOP_LINKS[0].clicks} triggered={triggered} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
