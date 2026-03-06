"use client";

import { cn } from "@/lib/utils";
import { Anchor } from "lucide-react";
import { useCallback } from "react";

export type SiteLogoProps = {
  /** RGB triplet override, e.g. "212 184 150". Falls back to --m-accent. */
  accent?: string;
  /** CSS color override for the background. Falls back to --m-card-bg. */
  cardBg?: string;
  className?: string;
  size?: "4xl" | "lg" | "md" | "sm" | "xl";
};

const sizeMap = {
  "4xl": { icon: "size-40", inner: "inset-[16px]", outer: "size-80", strokeWidth: 0.75 },
  lg: { icon: "size-11", inner: "inset-[6px]", outer: "size-28", strokeWidth: 1.25 },
  md: { icon: "size-9", inner: "inset-[5px]", outer: "size-20", strokeWidth: 1.5 },
  sm: { icon: "size-6", inner: "inset-[4px]", outer: "size-14", strokeWidth: 1.5 },
  xl: { icon: "size-16", inner: "inset-[8px]", outer: "size-40", strokeWidth: 1 },
};

export const SiteLogo: React.FC<SiteLogoProps> = ({ accent, cardBg, className, size = "md" }) => {
  const s = sizeMap[size];

  const outerRef = useCallback(
    (el: null | HTMLDivElement) => {
      if (!el) {
        return;
      }
      el.style.setProperty("--_logo-a", accent ?? "var(--m-accent)");
      el.style.setProperty("--_logo-bg", cardBg ?? "var(--m-card-bg)");
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
