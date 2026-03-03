"use client";

import { useEffect, useRef, useState } from "react";

// ─── Analytics preview ────────────────────────────────────────────────────────

const TOP_LINKS = [
  { clicks: 847, label: "Master Video Editing" },
  { clicks: 612, label: "YouTube Channel" },
  { clicks: 341, label: "Book a Call" },
];

// Catmull-Rom → cubic bezier (α=1/6). Every data point sits exactly on the curve.
const CHART_LINE = [
  "M 0 29.76",
  "C 7.78 28.40, 31.11 24.32, 46.67 21.6",
  "C 62.23 18.88, 77.77 13.84, 93.33 13.44",
  "C 108.89 13.04, 124.44 21.44, 140 19.2",
  "C 155.56 16.96, 171.11 1.92, 186.67 0",
  "C 202.23 0, 217.77 3.36, 233.33 7.68",
  "C 248.89 12.0, 272.22 22.88, 280 25.92",
].join(" ");

const CHART_AREA = `${CHART_LINE} L 280 48 L 0 48 Z`;
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const PEAK_IDX = 4;

export const AnalyticsPreview: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
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

  useEffect(() => {
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
          <span className="text-[11px] font-semibold" style={{ color: `rgb(var(--m-accent))` }}>
            ↑ 12%
          </span>
        </div>
        <p className="mt-1 text-[10px] tracking-[0.06em]" style={{ color: `rgb(var(--m-muted) / 0.4)` }}>
          clicks this week
        </p>
      </div>

      <div>
        <div className="relative">
          <svg
            className="w-full overflow-visible"
            preserveAspectRatio="none"
            style={{ height: "52px" }}
            viewBox="0 -10 280 58"
          >
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
          <style>{`
            @keyframes sonar-ring {
              0%   { transform: scale(0.4); opacity: 0.45; }
              22%  { transform: scale(2.2); opacity: 0; }
              100% { transform: scale(2.2); opacity: 0; }
            }
          `}</style>
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: "66.67%", top: "9px" }}
          >
            <div
              className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ animation: "sonar-ring 4s ease-out infinite", background: `rgb(var(--m-accent) / 0.28)` }}
            />
            <div
              className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ animation: "sonar-ring 4s ease-out 0.55s infinite", background: `rgb(var(--m-accent) / 0.22)` }}
            />
            <div
              className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: `rgb(var(--m-accent))`, boxShadow: `0 0 6px rgb(var(--m-accent) / 0.55)` }}
            />
          </div>
        </div>

        <div className="mt-1.5 flex justify-between">
          {DAYS.map((day, i) => (
            <span
              className="text-[9px] font-semibold"
              key={i}
              style={{ color: i === PEAK_IDX ? `rgb(var(--m-accent))` : `rgb(var(--m-muted) / 0.25)` }}
            >
              {day}
            </span>
          ))}
        </div>
      </div>

      <div className="h-px" style={{ background: `rgb(var(--m-muted) / 0.10)` }} />

      <div className="space-y-2.5">
        <p
          className="text-[9px] font-semibold tracking-[0.18em] uppercase"
          style={{ color: `rgb(var(--m-muted) / 0.28)` }}
        >
          Top links
        </p>
        {TOP_LINKS.map(({ clicks, label }, i) => (
          <div key={label}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="truncate text-[11px]" style={{ color: `rgb(var(--m-muted) / 0.6)` }}>
                {label}
              </span>
              <span
                className="ml-2 shrink-0 text-[11px] font-semibold tabular-nums"
                style={{ color: `rgb(var(--m-muted) / 0.4)` }}
              >
                {clicks.toLocaleString()}
              </span>
            </div>
            <div className="h-[2px] overflow-hidden rounded-full" style={{ background: `rgb(var(--m-muted) / 0.08)` }}>
              <div
                className="h-full rounded-full"
                style={{
                  background: `rgb(var(--m-accent) / ${0.65 - i * 0.18})`,
                  transition: "width 0.7s ease",
                  transitionDelay: triggered ? `${400 + i * 150}ms` : "0ms",
                  width: triggered ? `${(clicks / TOP_LINKS[0].clicks) * 100}%` : "0%",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
