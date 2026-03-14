import * as React from "react";

export type ProgressBarProps = {
  clicks: number;
  index: number;
  maxClicks: number;
  triggered: boolean;
};

export const ProgressBar: React.FC<ProgressBarProps> = (props) => {
  const { clicks, index, maxClicks, triggered } = props;

  //* Handlers
  const barRef = React.useCallback(
    (el: null | HTMLDivElement) => {
      if (el == null) {
        return;
      }
      const opacity = 0.65 - index * 0.18;
      el.style.setProperty("background", `rgb(var(--m-accent) / ${opacity})`);
      el.style.setProperty("transition", "width 0.7s ease");
      el.style.setProperty("transition-delay", triggered ? `${400 + index * 150}ms` : "0ms");
      el.style.setProperty("width", triggered ? `${(clicks / maxClicks) * 100}%` : "0%");
    },
    [clicks, index, maxClicks, triggered],
  );

  return <div className="h-full rounded-full" ref={barRef} />;
};
