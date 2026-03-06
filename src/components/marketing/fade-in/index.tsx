"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

type FadeInProps = {
  children: React.ReactNode;
  className?: string; // passed to the outer div (for grid placement etc.)
  delay?: number; // ms animation delay
};

export const FadeIn: React.FC<FadeInProps> = ({ children, className, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
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

  const delayRef = useCallback(
    (el: null | HTMLDivElement) => {
      if (!el) {
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
