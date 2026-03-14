"use client";

import { cn } from "@/lib/utils";
import { Anchor } from "lucide-react";
import * as React from "react";
import { SIZE_MAP } from "./constants";

export type SiteLogoProps = {
  /** RGB triplet override, e.g. "212 184 150". Falls back to --m-accent. */
  accent?: string;
  /** CSS color override for the background. Falls back to --m-card-bg. */
  cardBg?: string;
  className?: string;
  size?: "4xl" | "lg" | "md" | "sm" | "xl" | "xs";
};

export const SiteLogo: React.FC<SiteLogoProps> = (props) => {
  const { accent, cardBg, className, size = "md" } = props;

  const s = SIZE_MAP[size];

  const outerRef = React.useCallback(
    (el: null | HTMLDivElement) => {
      if (el == null) {
        return;
      }
      if (accent != null) {
        el.style.setProperty("--_logo-a", accent);
      }
      if (cardBg != null) {
        el.style.setProperty("--_logo-bg", cardBg);
      }
    },
    [accent, cardBg],
  );

  return (
    <div
      className={cn("site-logo relative flex items-center justify-center rounded-full", s.outer, className)}
      ref={outerRef}
    >
      <div className={cn("site-logo-inner absolute rounded-full", s.inner)} />
      <Anchor className={cn("site-logo-icon", s.icon)} strokeWidth={s.strokeWidth} />
    </div>
  );
};
