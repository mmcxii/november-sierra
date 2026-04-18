"use client";

import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";
import * as React from "react";
import {
  DELETE_SPEED_MS,
  LONG_URL,
  PAUSE_LONG_MS,
  PAUSE_SHORT_MS,
  SHORT_URL,
  TYPE_SPEED_MS,
  type Phase,
} from "./constants";

/**
 * Typewriter URL transformation. Animates a long marketing URL being typed,
 * deleted, and replaced with an `anch.to/launch` short URL. Loops. For
 * `prefers-reduced-motion` we bail to a static stacked view (long → arrow →
 * short) so the narrative still reads without motion.
 *
 * Rendered in two places: the homepage Short Links showcase section and the
 * `/short-links` hero. Same component, same states; dedicated visual so we're
 * not repeating the design token vocabulary.
 */
export const TypewriterUrlVisual: React.FC = () => {
  //* State
  const [text, setText] = React.useState("");
  const [phase, setPhase] = React.useState<Phase>("typing-long");
  const [reducedMotion, setReducedMotion] = React.useState(false);

  //* Variables
  const isShortPhase = phase === "typing-short" || phase === "pause-short" || phase === "deleting-short";

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

    let timeoutId: undefined | ReturnType<typeof setTimeout>;

    switch (phase) {
      case "typing-long":
        if (text.length < LONG_URL.length) {
          timeoutId = setTimeout(() => {
            setText(LONG_URL.slice(0, text.length + 1));
          }, TYPE_SPEED_MS);
        } else {
          setPhase("pause-long");
        }
        break;

      case "pause-long":
        timeoutId = setTimeout(() => {
          setPhase("deleting-long");
        }, PAUSE_LONG_MS);
        break;

      case "deleting-long":
        if (text.length > 0) {
          timeoutId = setTimeout(() => {
            setText(text.slice(0, -1));
          }, DELETE_SPEED_MS);
        } else {
          setPhase("typing-short");
        }
        break;

      case "typing-short":
        if (text.length < SHORT_URL.length) {
          timeoutId = setTimeout(() => {
            setText(SHORT_URL.slice(0, text.length + 1));
          }, TYPE_SPEED_MS);
        } else {
          setPhase("pause-short");
        }
        break;

      case "pause-short":
        timeoutId = setTimeout(() => {
          setPhase("deleting-short");
        }, PAUSE_SHORT_MS);
        break;

      case "deleting-short":
        if (text.length > 0) {
          timeoutId = setTimeout(() => {
            setText(text.slice(0, -1));
          }, DELETE_SPEED_MS);
        } else {
          setPhase("typing-long");
        }
        break;
    }

    return () => {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
      }
    };
  }, [text, phase, reducedMotion]);

  //* Render — reduced motion fallback

  if (reducedMotion) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-3 font-mono text-xs">
        <div className="m-embed-bg-bg m-muted-12-border w-full truncate rounded-lg px-3 py-2">
          { }
          <span className="m-muted-55-color">{LONG_URL}</span>
        </div>
        <ArrowDown className="m-muted-25 size-4 shrink-0" strokeWidth={1.5} />
        <div className="m-accent-05-bg m-accent-18-border w-full rounded-lg px-3 py-2">
          { }
          <span className="m-accent-60-color">{SHORT_URL}</span>
        </div>
      </div>
    );
  }

  //* Render — animated
  return (
    <div
      aria-hidden="true"
      className={cn(
        "m-muted-12-border flex min-h-10 w-full max-w-md items-center gap-0.5 overflow-hidden rounded-lg px-3 py-2 font-mono text-[11px] transition-colors duration-200",
        { "m-accent-05-bg": isShortPhase, "m-embed-bg-bg": !isShortPhase },
      )}
    >
      <span className={cn({ "m-accent-60-color": isShortPhase, "m-muted-55-color": !isShortPhase })}>{text}</span>
      <span className="m-accent-55-color shrink-0 after:content-['|'] motion-safe:animate-pulse" />
    </div>
  );
};
