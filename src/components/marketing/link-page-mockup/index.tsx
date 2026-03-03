"use client";

import {
  Anchor,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Pause,
  Play,
  Youtube,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { siInstagram, siTelegram, siX } from "simple-icons";

import { SiteLogo } from "@/components/marketing/site-logo";

const BASE = { rotateX: 12, rotateY: 22, rotateZ: -3 };
const FLIP_DURATION = 1600;

type CardTheme = {
  anchorColor: string;
  avatarBg: string;
  avatarInnerBorder: string;
  avatarOuterRing: string;
  border: string;
  brand: string;
  cardBg: string;
  divider: string;
  featuredBg: string;
  featuredBorder: string;
  featuredIconBg: string;
  featuredIconColor: string;
  featuredText: string;
  glowBg: string;
  hairline: string;
  handle: string;
  linkBg: string;
  linkBorder: string;
  linkIconBg: string;
  linkIconColor: string;
  linkText: string;
  name: string;
  nameColor: string;
  themeName: string;
};

const THEMES: CardTheme[] = [
  // Theme 0: Dark Depths — deep nautical dark
  {
    anchorColor: "#d4b896",
    avatarBg: "#050b14",
    avatarInnerBorder: "rgba(146,176,190,0.13)",
    avatarOuterRing: "rgba(212,184,150,0.30)",
    border: "rgba(146,176,190,0.16)",
    brand: "rgba(212,184,150,0.38)",
    cardBg: "linear-gradient(160deg, #111e2e 0%, #080f1c 55%, #050b14 100%)",
    divider: "rgba(146,176,190,0.09)",
    featuredBg: "rgba(212,184,150,0.10)",
    featuredBorder: "rgba(212,184,150,0.35)",
    featuredIconBg: "rgba(212,184,150,0.20)",
    featuredIconColor: "#d4b896",
    featuredText: "#d4b896",
    glowBg: "radial-gradient(ellipse, #243550 0%, transparent 70%)",
    hairline: "#d4b896",
    handle: "@calvin",
    linkBg: "rgba(5,11,20,0.60)",
    linkBorder: "rgba(146,176,190,0.09)",
    linkIconBg: "rgba(146,176,190,0.09)",
    linkIconColor: "rgba(146,176,190,0.55)",
    linkText: "rgba(146,176,190,0.70)",
    name: "Calvin River",
    nameColor: "#ffffff",
    themeName: "Dark Depths",
  },
  // Theme 1: Stateroom — warm cream, dark navy accent (mirror of Dark Depths)
  {
    anchorColor: "#0a1729",
    avatarBg: "#fdfaf2",
    avatarInnerBorder: "rgba(10,23,41,0.10)",
    avatarOuterRing: "rgba(10,23,41,0.25)",
    border: "rgba(10,23,41,0.10)",
    brand: "rgba(10,23,41,0.30)",
    cardBg: "linear-gradient(160deg, #fdfaf2 0%, #f5edda 55%, #ece0c0 100%)",
    divider: "rgba(10,23,41,0.08)",
    featuredBg: "rgba(10,23,41,0.06)",
    featuredBorder: "rgba(10,23,41,0.22)",
    featuredIconBg: "rgba(10,23,41,0.10)",
    featuredIconColor: "#0a1729",
    featuredText: "#0a1729",
    glowBg: "radial-gradient(ellipse, rgba(185,158,90,0.12) 0%, transparent 70%)",
    hairline: "#0a1729",
    handle: "@calvin",
    linkBg: "rgba(253,250,242,0.80)",
    linkBorder: "rgba(10,23,41,0.08)",
    linkIconBg: "rgba(10,23,41,0.06)",
    linkIconColor: "rgba(10,23,41,0.40)",
    linkText: "rgba(10,23,41,0.55)",
    name: "Calvin River",
    nameColor: "#18120a",
    themeName: "Stateroom",
  },
  // Theme 2: Obsidian & Rose Gold — pure black with rose gold
  {
    anchorColor: "#c49480",
    avatarBg: "#080606",
    avatarInnerBorder: "rgba(196,148,128,0.16)",
    avatarOuterRing: "rgba(196,148,128,0.38)",
    border: "rgba(196,148,128,0.18)",
    brand: "rgba(196,148,128,0.40)",
    cardBg: "linear-gradient(160deg, #141010 0%, #0c0909 55%, #080606 100%)",
    divider: "rgba(196,148,128,0.10)",
    featuredBg: "rgba(196,148,128,0.08)",
    featuredBorder: "rgba(196,148,128,0.32)",
    featuredIconBg: "rgba(196,148,128,0.16)",
    featuredIconColor: "#c49480",
    featuredText: "#c49480",
    glowBg: "radial-gradient(ellipse, rgba(196,148,128,0.08) 0%, transparent 70%)",
    hairline: "#c49480",
    handle: "@calvin",
    linkBg: "rgba(8,6,6,0.70)",
    linkBorder: "rgba(196,148,128,0.10)",
    linkIconBg: "rgba(196,148,128,0.08)",
    linkIconColor: "rgba(196,148,128,0.50)",
    linkText: "rgba(196,148,128,0.60)",
    name: "Calvin River",
    nameColor: "#ffffff",
    themeName: "Obsidian",
  },
  // Theme 3: Seafoam Morning — white to pale mint, coastal air
  {
    anchorColor: "#1a7050",
    avatarBg: "#dff5ec",
    avatarInnerBorder: "rgba(40,130,95,0.28)",
    avatarOuterRing: "rgba(40,130,95,0.50)",
    border: "rgba(40,130,95,0.30)",
    brand: "rgba(30,120,80,0.60)",
    cardBg: "linear-gradient(160deg, #dff5ec 0%, #c2e8d8 55%, #a4d9c3 100%)",
    divider: "rgba(40,130,95,0.22)",
    featuredBg: "rgba(210,90,70,0.09)",
    featuredBorder: "rgba(210,90,70,0.30)",
    featuredIconBg: "rgba(210,90,70,0.18)",
    featuredIconColor: "#b8503c",
    featuredText: "#a84030",
    glowBg: "radial-gradient(ellipse, rgba(40,160,115,0.18) 0%, transparent 70%)",
    hairline: "#28a070",
    handle: "@calvin",
    linkBg: "rgba(200,232,216,0.65)",
    linkBorder: "rgba(40,130,95,0.22)",
    linkIconBg: "rgba(40,130,95,0.15)",
    linkIconColor: "rgba(25,110,75,0.75)",
    linkText: "rgba(15,70,45,0.80)",
    name: "Calvin River",
    nameColor: "#061a10",
    themeName: "Seafoam",
  },
];

const SOCIAL_ICONS = [
  { label: "X", path: siX.path },
  { label: "Instagram", path: siInstagram.path },
  { label: "Telegram", path: siTelegram.path },
  { Icon: Zap, label: "Nostr" },
] as const;

const LINKS = [
  { icon: Youtube, label: "YouTube Channel" },
  { icon: BookOpen, label: "Latest Blog Post" },
  { icon: CalendarDays, label: "Book a Call" },
] as const;

const CardBack: React.FC = () => (
  <div
    className="absolute inset-0 overflow-hidden rounded-2xl border border-[#92b0be]/20"
    style={{
      backfaceVisibility: "hidden",
      background: "#0a1729",
      transform: "rotateY(180deg)",
    }}
  >
    {/* Wave pattern */}
    <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern height="18" id="anchrWaves" patternUnits="userSpaceOnUse" width="280" x="0" y="0">
          <path
            d="M-70,9 C-52.5,2 -17.5,16 0,9 C17.5,2 52.5,16 70,9 C87.5,2 122.5,16 140,9 C157.5,2 192.5,16 210,9 C227.5,2 262.5,16 280,9 C297.5,2 332.5,16 350,9"
            fill="none"
            opacity="0.22"
            stroke="#92b0be"
            strokeWidth="0.75"
          />
        </pattern>
      </defs>
      <rect fill="url(#anchrWaves)" height="100%" width="100%" />
    </svg>

    {/* Inset gold border */}
    <div className="absolute inset-[10px] rounded-xl border border-[#d4b896]/25" />

    {/* Corner anchors */}
    {["top-4 left-4", "top-4 right-4 rotate-180", "bottom-4 left-4 rotate-180", "bottom-4 right-4"].map((pos) => (
      <div className={`absolute ${pos} text-[#d4b896]/35`} key={pos}>
        <Anchor className="size-3.5" strokeWidth={1.5} />
      </div>
    ))}

    {/* Center medallion — always dark regardless of page theme */}
    <div className="absolute inset-0 flex items-center justify-center" data-marketing-theme="dark">
      <SiteLogo size="lg" />
    </div>
  </div>
);

export const LinkPageMockup: React.FC = () => {
  const [rotation, setRotation] = useState(BASE);
  const [themeIndex, setThemeIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const rotateYRef = useRef(BASE.rotateY);
  const hoveredRef = useRef(false);
  const playingRef = useRef(true);
  const animatingRef = useRef(false);

  // Theme cycling — every 5 s
  useEffect(() => {
    const interval = setInterval(() => {
      if (hoveredRef.current || !playingRef.current || animatingRef.current) {
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
    if (animatingRef.current) {
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
      <div
        className="relative h-[460px] w-[280px]"
        style={{
          filter: `drop-shadow(0 30px 60px rgb(var(--m-shadow) / 0.35))`,
          perspective: "700px",
        }}
      >
        <div
          className="relative h-full w-full"
          style={{
            transform: `rotateX(${rotation.rotateX}deg) rotateY(${rotation.rotateY}deg) rotateZ(${rotation.rotateZ}deg)`,
            transformStyle: "preserve-3d",
            transition: "transform 1.6s ease-in-out",
          }}
        >
          {/* FRONT */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl"
            style={{
              backfaceVisibility: "hidden",
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
            }}
          >
            {/* Hairline accent */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(to right, transparent, ${theme.hairline}99, transparent)`,
              }}
            />

            {/* Radial glow */}
            <div
              className="pointer-events-none absolute top-0 left-1/2 h-36 w-52 -translate-x-1/2 rounded-full opacity-25 blur-2xl"
              style={{ background: theme.glowBg }}
            />

            {/* Wave texture */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              style={{
                maskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 26%, transparent 40%)",
              }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern height="18" id="frontWaves" patternUnits="userSpaceOnUse" width="280" x="0" y="0">
                  <path
                    d="M-70,9 C-52.5,2 -17.5,16 0,9 C17.5,2 52.5,16 70,9 C87.5,2 122.5,16 140,9 C157.5,2 192.5,16 210,9 C227.5,2 262.5,16 280,9 C297.5,2 332.5,16 350,9"
                    fill="none"
                    opacity="0.18"
                    stroke={theme.hairline}
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
                  <div
                    className="flex size-[68px] items-center justify-center rounded-full"
                    style={{ border: `1px solid ${theme.avatarOuterRing}` }}
                  >
                    <div
                      className="flex size-[52px] items-center justify-center rounded-full"
                      style={{
                        background: theme.avatarBg,
                        border: `1px solid ${theme.avatarInnerBorder}`,
                      }}
                    >
                      <Anchor className="size-6" strokeWidth={1.25} style={{ color: theme.anchorColor }} />
                    </div>
                  </div>
                </div>
                <p className="text-sm font-bold tracking-wide" style={{ color: theme.nameColor }}>
                  {theme.name}
                </p>
                <p
                  className="mt-0.5 text-[10px] font-medium tracking-[0.2em] uppercase"
                  style={{ color: theme.linkText }}
                >
                  {theme.handle}
                </p>

                {/* Social icons */}
                <div className="mt-2.5 flex items-center gap-1.5">
                  {SOCIAL_ICONS.map((social) => (
                    <div
                      className="flex size-[22px] items-center justify-center rounded-full"
                      key={social.label}
                      style={{
                        background: theme.linkIconBg,
                        border: `1px solid ${theme.linkBorder}`,
                      }}
                    >
                      {"Icon" in social ? (
                        <social.Icon className="size-2.5" strokeWidth={1.75} style={{ color: theme.linkIconColor }} />
                      ) : (
                        <svg
                          className="size-2.5"
                          fill="currentColor"
                          style={{ color: theme.linkIconColor }}
                          viewBox="0 0 24 24"
                        >
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
                <div
                  className="relative overflow-hidden rounded-xl px-3.5 py-3"
                  style={{
                    background: theme.featuredBg,
                    border: `1px solid ${theme.featuredBorder}`,
                  }}
                >
                  <div className="relative flex items-center gap-2.5">
                    <div
                      className="flex size-6 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: theme.featuredIconBg }}
                    >
                      <GraduationCap
                        className="size-3.5"
                        strokeWidth={1.75}
                        style={{ color: theme.featuredIconColor }}
                      />
                    </div>
                    <span
                      className="flex-1 text-center text-[11px] leading-tight font-semibold"
                      style={{ color: theme.featuredText }}
                    >
                      Master Video Editing — Enroll Now
                    </span>
                  </div>
                </div>

                {/* Regular links */}
                {LINKS.map(({ icon: Icon, label }) => (
                  <div
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                    key={label}
                    style={{
                      background: theme.linkBg,
                      border: `1px solid ${theme.linkBorder}`,
                    }}
                  >
                    <div
                      className="flex size-6 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: theme.linkIconBg }}
                    >
                      <Icon className="size-3.5" strokeWidth={1.75} style={{ color: theme.linkIconColor }} />
                    </div>
                    <span className="flex-1 text-center text-[11px] font-medium" style={{ color: theme.linkText }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Branding */}
              <div
                className="mt-auto flex items-center justify-center gap-1.5 pt-2"
                style={{ borderTop: `1px solid ${theme.divider}` }}
              >
                <Anchor className="size-2.5" strokeWidth={1.5} style={{ color: theme.brand }} />
                <span className="text-[9px] font-bold tracking-[0.25em] uppercase" style={{ color: theme.brand }}>
                  Anchr
                </span>
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
        <span
          className="text-[10px] font-medium tracking-[0.18em] uppercase"
          style={{ color: `rgb(var(--m-muted) / 0.45)` }}
        >
          {theme.themeName}
        </span>

        {/* Theme dots */}
        <div className="flex items-center gap-1.5">
          {THEMES.map((_, i) => (
            <div
              className="rounded-full transition-all duration-300"
              key={i}
              style={{
                background: i === themeIndex ? `rgb(var(--m-accent) / 0.70)` : `rgb(var(--m-muted) / 0.25)`,
                height: "4px",
                width: i === themeIndex ? "16px" : "4px",
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            aria-label="Previous theme"
            className="flex size-7 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm transition-colors"
            onClick={() => navigate(-1)}
            style={{
              background: `var(--m-embed-bg)`,
              border: `1px solid rgb(var(--m-muted) / 0.20)`,
              color: `rgb(var(--m-muted) / 0.50)`,
            }}
          >
            <ChevronLeft className="size-3.5" strokeWidth={1.5} />
          </button>

          <button
            aria-label={playing ? "Pause" : "Play"}
            className="flex size-7 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm transition-colors"
            onClick={handlePlayPause}
            style={{
              background: `var(--m-embed-bg)`,
              border: `1px solid rgb(var(--m-muted) / 0.20)`,
              color: `rgb(var(--m-muted) / 0.50)`,
            }}
          >
            {playing ? (
              <Pause className="size-3" strokeWidth={1.5} />
            ) : (
              <Play className="size-3 translate-x-px" strokeWidth={1.5} />
            )}
          </button>

          <button
            aria-label="Next theme"
            className="flex size-7 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm transition-colors"
            onClick={() => navigate(1)}
            style={{
              background: `var(--m-embed-bg)`,
              border: `1px solid rgb(var(--m-muted) / 0.20)`,
              color: `rgb(var(--m-muted) / 0.50)`,
            }}
          >
            <ChevronRight className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
};
