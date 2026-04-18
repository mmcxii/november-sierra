"use client";

import { Clock } from "lucide-react";
import * as React from "react";
import { HOURS_PER_DAY, MINUTES_PER_HOUR, SECONDS_PER_MINUTE, computeInitialTotalSeconds, pad } from "./constants";

/**
 * Live countdown rendered in the Expiring-links card. Starts at 21d 12h
 * 59m 59s and decrements every second. Monospace so layout doesn't shift.
 * Under `prefers-reduced-motion` we freeze at the initial value (no
 * animation, still communicates "this link expires").
 */
export const ExpiryCountdown: React.FC = () => {
  //* State
  const [secondsLeft, setSecondsLeft] = React.useState(computeInitialTotalSeconds);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  //* Variables
  const days = Math.floor(secondsLeft / (HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE));
  const hours = Math.floor(
    (secondsLeft % (HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE)) / (MINUTES_PER_HOUR * SECONDS_PER_MINUTE),
  );
  const minutes = Math.floor((secondsLeft % (MINUTES_PER_HOUR * SECONDS_PER_MINUTE)) / SECONDS_PER_MINUTE);
  const seconds = secondsLeft % SECONDS_PER_MINUTE;

  //* Effects
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mq.addEventListener("change", handleChange);

    return () => {
      mq.removeEventListener("change", handleChange);
    };
  }, []);

  React.useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : computeInitialTotalSeconds()));
    }, 1000);

    return () => {
      clearInterval(id);
    };
  }, [reducedMotion]);

  return (
    <div className="m-embed-bg-bg m-muted-12-border mt-4 flex items-center gap-2 rounded-lg px-3 py-2">
      <Clock className="m-accent-55-color size-3.5 shrink-0" strokeWidth={1.5} />
      <div className="m-muted-70 font-mono text-[11px] tabular-nums">
        { }
        {days}
        {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- countdown format */}
        {"d "}
        {pad(hours)}
        {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- countdown format */}
        {"h "}
        {pad(minutes)}
        {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- countdown format */}
        {"m "}
        {pad(seconds)}
        {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- countdown format */}
        {"s"}
      </div>
    </div>
  );
};
