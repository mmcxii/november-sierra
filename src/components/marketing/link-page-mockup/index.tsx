"use client";

import { cn } from "@/lib/utils";
import { Anchor, ChevronLeft, ChevronRight, GraduationCap, Pause, Play } from "lucide-react";
import * as React from "react";
import { CardBack } from "./card-back";
import { BASE, FLIP_DURATION, LINKS, SOCIAL_ICONS, THEMES } from "./constants";

export const LinkPageMockup: React.FC = () => {
  const [rotation, setRotation] = React.useState(BASE);
  const [themeIndex, setThemeIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const rotateYRef = React.useRef(BASE.rotateY);
  const hoveredRef = React.useRef(false);
  const playingRef = React.useRef(true);
  const animatingRef = React.useRef(false);

  // Theme cycling — every 5 s
  React.useEffect(() => {
    const interval = setInterval(() => {
      if ((hoveredRef.current ?? !playingRef.current) || animatingRef.current) {
        return;
      }

      animatingRef.current = true;
      rotateYRef.current -= 360;
      setRotation({ rotateX: BASE.rotateX, rotateY: rotateYRef.current, rotateZ: BASE.rotateZ });

      setTimeout(() => {
        setThemeIndex((prev) => (prev + 1) % THEMES.length);
      }, FLIP_DURATION / 2);

      setTimeout(() => {
        animatingRef.current = false;
      }, FLIP_DURATION);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const navigate = (direction: -1 | 1) => {
    if (animatingRef.current != null) {
      return;
    }

    animatingRef.current = true;
    // Forward goes negative (same as auto-cycle), back goes positive (visual reversal)
    rotateYRef.current += direction === 1 ? -360 : 360;
    setRotation({ rotateX: BASE.rotateX, rotateY: rotateYRef.current, rotateZ: BASE.rotateZ });

    setTimeout(() => {
      setThemeIndex((prev) => (prev + direction + THEMES.length) % THEMES.length);
    }, FLIP_DURATION / 2);

    setTimeout(() => {
      animatingRef.current = false;
    }, FLIP_DURATION);
  };

  const handlePlayPause = () => {
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  };

  const theme = THEMES[themeIndex];

  /** Single ref that pushes every theme token into CSS custom properties. */
  const cardRef = React.useCallback(
    (el: null | HTMLDivElement) => {
      if (el == null) {
        return;
      }
      el.style.setProperty("--_mc-card-bg", theme.cardBg);
      el.style.setProperty("--_mc-border", theme.border);
      el.style.setProperty("--_mc-hairline", theme.hairline);
      el.style.setProperty("--_mc-glow-bg", theme.glowBg);
      el.style.setProperty("--_mc-avatar-outer-ring", theme.avatarOuterRing);
      el.style.setProperty("--_mc-avatar-bg", theme.avatarBg);
      el.style.setProperty("--_mc-avatar-inner-border", theme.avatarInnerBorder);
      el.style.setProperty("--_mc-anchor-color", theme.anchorColor);
      el.style.setProperty("--_mc-name-color", theme.nameColor);
      el.style.setProperty("--_mc-link-text", theme.linkText);
      el.style.setProperty("--_mc-link-icon-bg", theme.linkIconBg);
      el.style.setProperty("--_mc-link-icon-color", theme.linkIconColor);
      el.style.setProperty("--_mc-link-border", theme.linkBorder);
      el.style.setProperty("--_mc-link-bg", theme.linkBg);
      el.style.setProperty("--_mc-featured-bg", theme.featuredBg);
      el.style.setProperty("--_mc-featured-border", theme.featuredBorder);
      el.style.setProperty("--_mc-featured-icon-bg", theme.featuredIconBg);
      el.style.setProperty("--_mc-featured-icon-color", theme.featuredIconColor);
      el.style.setProperty("--_mc-featured-text", theme.featuredText);
      el.style.setProperty("--_mc-divider", theme.divider);
      el.style.setProperty("--_mc-brand", theme.brand);
    },
    [theme],
  );

  /** Ref for the 3D rotating inner wrapper — sets transform dynamically. */
  const flipRef = React.useCallback(
    (el: null | HTMLDivElement) => {
      if (el == null) {
        return;
      }
      el.style.setProperty(
        "transform",
        `rotateX(${rotation.rotateX}deg) rotateY(${rotation.rotateY}deg) rotateZ(${rotation.rotateZ}deg)`,
      );
    },
    [rotation],
  );

  return (
    <div
      className="flex flex-col items-center gap-4 select-none"
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
    >
      {/* Card */}
      <div className="m-mockup-shadow relative h-[460px] w-[280px] [perspective:700px]">
        <div
          className="m-preserve-3d m-mockup-card relative h-full w-full transition-[transform] duration-[1.6s] ease-in-out"
          ref={(el) => {
            cardRef(el);
            flipRef(el);
          }}
        >
          {/* FRONT */}
          <div className="mc-front absolute inset-0 overflow-hidden rounded-2xl">
            {/* Hairline accent */}
            <div className="mc-hairline absolute inset-x-0 top-0 h-px" />

            {/* Radial glow */}
            <div className="mc-glow pointer-events-none absolute top-0 left-1/2 h-36 w-52 -translate-x-1/2 rounded-full opacity-25 blur-2xl" />

            {/* Wave texture */}
            <svg
              className="m-wave-front-mask pointer-events-none absolute inset-0 h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern height="18" id="frontWaves" patternUnits="userSpaceOnUse" width="280" x="0" y="0">
                  <path
                    className="mc-anchor-color"
                    d="M-70,9 C-52.5,2 -17.5,16 0,9 C17.5,2 52.5,16 70,9 C87.5,2 122.5,16 140,9 C157.5,2 192.5,16 210,9 C227.5,2 262.5,16 280,9 C297.5,2 332.5,16 350,9"
                    fill="none"
                    opacity="0.18"
                    stroke="currentColor"
                    strokeWidth="0.75"
                  />
                </pattern>
              </defs>
              <rect fill="url(#frontWaves)" height="100%" width="100%" />
            </svg>

            <div className="relative flex h-full flex-col px-5 pt-5 pb-5">
              {/* Avatar */}
              <div className="mb-3 flex flex-col items-center pt-1">
                <div className="relative mb-3">
                  <div className="mc-avatar-outer flex size-[68px] items-center justify-center rounded-full">
                    <div className="mc-avatar-inner flex size-[52px] items-center justify-center rounded-full">
                      <Anchor className="mc-anchor-color size-6" strokeWidth={1.25} />
                    </div>
                  </div>
                </div>
                <p className="mc-name-color text-sm font-bold tracking-wide">{theme.name}</p>
                <p className="mc-link-text mt-0.5 text-[10px] font-medium tracking-[0.2em] uppercase">{theme.handle}</p>

                {/* Social icons */}
                <div className="mt-2.5 flex items-center gap-1.5">
                  {SOCIAL_ICONS.map((social) => (
                    <div
                      className="mc-social-icon flex size-[22px] items-center justify-center rounded-full"
                      key={social.label}
                    >
                      {"Icon" in social ? (
                        <social.Icon className="mc-link-icon-color size-2.5" strokeWidth={1.75} />
                      ) : (
                        <svg className="mc-link-icon-color size-2.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d={social.path} />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="flex flex-col gap-1.5">
                {/* Featured */}
                <div className="mc-featured relative overflow-hidden rounded-xl px-3.5 py-3">
                  <div className="relative flex items-center gap-2.5">
                    <div className="mc-featured-icon-bg flex size-6 shrink-0 items-center justify-center rounded-lg">
                      <GraduationCap className="mc-featured-icon-color size-3.5" strokeWidth={1.75} />
                    </div>
                    <span className="mc-featured-text flex-1 text-center text-[11px] leading-tight font-semibold">
                      Master Video Editing — Enroll Now
                    </span>
                  </div>
                </div>

                {/* Regular links */}
                {LINKS.map(({ icon: Icon, label }) => (
                  <div className="mc-link flex items-center gap-2.5 rounded-xl px-3.5 py-2.5" key={label}>
                    <div className="mc-link-icon-bg flex size-6 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="mc-link-icon-color size-3.5" strokeWidth={1.75} />
                    </div>
                    <span className="mc-link-text flex-1 text-center text-[11px] font-medium">{label}</span>
                  </div>
                ))}
              </div>

              {/* Branding */}
              <div className="mc-branding mt-auto flex items-center justify-center gap-1.5 pt-2">
                <Anchor className="mc-brand-color size-2.5" strokeWidth={1.5} />
                <span className="mc-brand-color text-[9px] font-bold tracking-[0.25em] uppercase">Anchr</span>
              </div>
            </div>
          </div>

          {/* BACK */}
          <CardBack />
        </div>
      </div>

      {/* Controls */}
      <div className="mt-7 flex flex-col items-center gap-2.5">
        {/* Theme name */}
        <span className="m-muted-45 text-[10px] font-medium tracking-[0.18em] uppercase">{theme.themeName}</span>

        {/* Theme dots */}
        <div className="flex items-center gap-1.5">
          {THEMES.map((_, i) => (
            <div
              className={cn("rounded-full transition-all duration-300", {
                "m-dot-active": i === themeIndex,
                "m-dot-inactive": i !== themeIndex,
              })}
              key={i}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            aria-label="Previous theme"
            className="m-mockup-nav-btn flex size-7 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm transition-colors"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="size-3.5" strokeWidth={1.5} />
          </button>

          <button
            aria-label={playing ? "Pause" : "Play"}
            className="m-mockup-nav-btn flex size-7 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm transition-colors"
            onClick={handlePlayPause}
          >
            {playing ? (
              <Pause className="size-3" strokeWidth={1.5} />
            ) : (
              <Play className="size-3 translate-x-px" strokeWidth={1.5} />
            )}
          </button>

          <button
            aria-label="Next theme"
            className="m-mockup-nav-btn flex size-7 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm transition-colors"
            onClick={() => navigate(1)}
          >
            <ChevronRight className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
};
