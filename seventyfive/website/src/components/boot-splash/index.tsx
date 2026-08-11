"use client";

import * as React from "react";

/**
 * Cold-start splash. SSR paints it in the first HTML; after hydrate it fades out
 * and unmounts. Root layout does not remount on client navigations, so it won’t
 * flash again between pages.
 */
export const BootSplash: React.FC = () => {
  //* State
  const [phase, setPhase] = React.useState<"gone" | "in" | "out">("in");

  //* Effects
  React.useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.dataset.sfBooted = "true";

    if (reducedMotion) {
      setPhase("gone");
      return;
    }

    setPhase("out");
    const timer = window.setTimeout(() => {
      setPhase("gone");
    }, 480);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  if (phase === "gone") {
    return null;
  }

  return (
    <div aria-hidden="true" data-phase={phase} id="sf-boot-splash">
      <div className="sf-boot-splash-glow" />
      <div className="sf-boot-splash-inner">
        <span className="sf-brand-pulse-ember sf-brand-pulse-ember-lg" />
      </div>
    </div>
  );
};
