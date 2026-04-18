import { cn } from "@/lib/utils";
import { SOURCE_BARS, SPARKLINE_HEIGHT, SPARKLINE_PADDING, SPARKLINE_POINTS, SPARKLINE_WIDTH } from "./constants";

/**
 * Compact analytics visualization for the Click analytics card. Sparkline
 * shows 7-day click volume; three bars beneath split total clicks by source
 * (Profile / Short URL / Direct) — mirrors the actual source-attribution
 * split available in the product today.
 */
export const AnalyticsMiniChart: React.FC = () => {
  const maxValue = Math.max(...SPARKLINE_POINTS);
  const stepX = (SPARKLINE_WIDTH - SPARKLINE_PADDING * 2) / (SPARKLINE_POINTS.length - 1);
  const path = SPARKLINE_POINTS.map((value, i) => {
    const x = SPARKLINE_PADDING + i * stepX;
    const y = SPARKLINE_HEIGHT - SPARKLINE_PADDING - (value / maxValue) * (SPARKLINE_HEIGHT - SPARKLINE_PADDING * 2);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  return (
    <div className="m-embed-bg-bg m-muted-12-border mt-4 flex flex-col gap-2 rounded-lg px-3 py-3">
      <svg
        aria-hidden="true"
        className="w-full"
        height={SPARKLINE_HEIGHT}
        preserveAspectRatio="none"
        viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      >
        <path
          className="m-accent-55-color"
          d={path}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
        />
      </svg>
      <div className="flex items-end justify-between gap-1.5">
        {SOURCE_BARS.map((bar) => (
          <div className="flex flex-1 flex-col items-center gap-1" key={bar.label}>
            <div aria-hidden="true" className={cn("m-accent-18-bg w-full rounded-sm", bar.heightClass)} />
            <span className="m-muted-55-color text-[9px] font-medium">{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
