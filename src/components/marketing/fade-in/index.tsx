"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

type FadeInProps = {
  children: React.ReactNode;
  className?: string; // passed to the outer div (for grid placement etc.)
  delay?: number; // ms animation delay
};

export const FadeIn: React.FC<FadeInProps> = (props) => {
  const { children, className, delay = 0 } = props;

  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (el == null) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const delayRef = React.useCallback(
    (el: null | HTMLDivElement) => {
      if (el == null) {
        return;
      }
      ref.current = el;
      if (delay > 0) {
        el.style.setProperty("transition-delay", `${delay}ms`);
      }
    },
    [delay],
  );

  return (
    <div className={cn("m-fade-in", { "is-visible": visible }, className)} ref={delayRef}>
      {children}
    </div>
  );
};
