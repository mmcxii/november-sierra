"use client";

import { ANIMATION_PHASES, TAGLINE_KEYS, type AnimationPhase } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useTranslation } from "react-i18next";

export const Hero: React.FC = () => {
  //* State
  const [phase, setPhase] = React.useState<AnimationPhase>("ns");
  const { t } = useTranslation();

  //* Variables
  const phaseIndex = ANIMATION_PHASES.indexOf(phase);
  const barsVisible = phaseIndex >= 1;
  const nameRevealed = phaseIndex >= 2;
  const taglineVisible = phaseIndex >= 3;
  const scrollVisible = phaseIndex >= 4;

  //* Effects
  React.useEffect(() => {
    const timers = [
      setTimeout(() => {
        setPhase("bars");
      }, 1200),
      setTimeout(() => {
        setPhase("full-name");
      }, 2400),
      setTimeout(() => {
        setPhase("tagline");
      }, 4000),
      setTimeout(() => {
        setPhase("complete");
      }, 5800),
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <section className="relative flex h-[100vh] h-dvh items-center justify-center overflow-hidden" id="hero">
      {/* Ken Burns background */}
      <div className="absolute inset-0">
        <div className="ken-burns absolute inset-0">
          <Image alt="" className="object-cover" fill priority sizes="100vw" src="/images/hero-forest.jpg" />
        </div>
        <div className="bg-ns-hero-overlay absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        {/* Top bar */}
        <div
          aria-hidden="true"
          className={cn(
            "wordmark-bar bg-ns-text-heading mb-4 h-px",
            { "opacity-0": !barsVisible, "opacity-100": barsVisible },
            { "w-8": !nameRevealed, "w-full": nameRevealed },
          )}
        />

        {/* Wordmark */}
        <h1 className="text-ns-text-heading relative font-serif text-[clamp(2rem,6vw,4.5rem)] leading-none tracking-widest whitespace-nowrap">
          <span className="inline-block overflow-hidden">
            <span>{"N"}</span>
            <span
              className={cn("wordmark-letters", {
                "max-w-0 opacity-0": !nameRevealed,
                "max-w-[10em] opacity-100": nameRevealed,
              })}
            >
              {"OVEMBER"}
            </span>
          </span>
          <span className={cn("wordmark-spacer", { "w-[0.1em]": !nameRevealed, "w-[0.3em]": nameRevealed })} />
          <span className="inline-block overflow-hidden">
            <span>{"S"}</span>
            <span
              className={cn("wordmark-letters", {
                "max-w-0 opacity-0": !nameRevealed,
                "max-w-[10em] opacity-100": nameRevealed,
              })}
            >
              {"IERRA"}
            </span>
          </span>
        </h1>

        {/* Bottom bar */}
        <div
          aria-hidden="true"
          className={cn(
            "wordmark-bar bg-ns-text-heading mt-4 h-px",
            { "opacity-0": !barsVisible, "opacity-100": barsVisible },
            { "w-8": !nameRevealed, "w-full": nameRevealed },
          )}
        />

        {/* Tagline */}
        <p className="mt-8 flex gap-3 font-serif">
          {TAGLINE_KEYS.map((key, i) => {
            return (
              <span
                className={cn("text-ns-text text-lg tracking-wide italic transition-all duration-700 md:text-xl", {
                  "-translate-y-2 opacity-0": !taglineVisible,
                  "translate-y-0 opacity-100": taglineVisible,
                })}
                key={key}
                style={{ transitionDelay: `${i * 0.5}s` }}
              >
                {t(key)}
              </span>
            );
          })}
        </p>
      </div>

      {/* Scroll indicator */}
      <a
        aria-label={t("scrollToAboutSection")}
        className={cn(
          "pulse-arrow text-ns-text absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-700",
          { "opacity-0": !scrollVisible, "opacity-100": scrollVisible },
        )}
        href="#about"
      >
        <ChevronDown size={32} />
      </a>
    </section>
  );
};
