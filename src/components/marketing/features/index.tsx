import type { TFunction } from "i18next";
import { Anchor, ArrowUpRight, BarChart3, ChevronRight, Globe, Palette, Zap } from "lucide-react";

import { AnalyticsPreview } from "@/components/marketing/analytics-preview";
import { FadeIn } from "@/components/marketing/fade-in";
import { RedirectHubUrlPreview } from "@/components/marketing/redirect-hub-url-preview";

export type FeaturesProps = {
  t: TFunction;
};

// ─── Blazing Fast visual ───────────────────────────────────────────────────────

const BlazingFastVisual: React.FC = () => (
  <div className="mt-5">
    <style>{`
      @keyframes speed-bar {
        0%   { width: 0%;   opacity: 0.85; }
        10%  { width: 100%; opacity: 0.85; }
        18%  { width: 100%; opacity: 0; }
        19%  { width: 0%; }
        100% { width: 0%; opacity: 0; }
      }
      @keyframes speed-content {
        0%   { opacity: 0; }
        10%  { opacity: 0; }
        16%  { opacity: 1; }
        82%  { opacity: 1; }
        88%  { opacity: 0; }
        100% { opacity: 0; }
      }
    `}</style>
    <div
      className="overflow-hidden rounded-xl"
      style={{ background: `var(--m-embed-bg)`, border: `1px solid rgb(var(--m-muted) / 0.12)` }}
    >
      {/* Loading bar */}
      <div className="h-[2px]">
        <div
          className="h-full"
          style={{ animation: "speed-bar 4s ease-in-out infinite", background: `rgb(var(--m-accent))` }}
        />
      </div>
      {/* Page content that appears */}
      <div className="space-y-2.5 px-5 py-4" style={{ animation: "speed-content 4s ease-in-out infinite" }}>
        <div className="mx-auto size-6 rounded-full" style={{ background: `rgb(var(--m-accent) / 0.22)` }} />
        <div className="space-y-1.5">
          <div className="h-2 rounded-full" style={{ background: `rgb(var(--m-accent) / 0.16)` }} />
          <div className="h-2 rounded-full" style={{ background: `rgb(var(--m-muted) / 0.10)` }} />
          <div className="h-2 rounded-full" style={{ background: `rgb(var(--m-muted) / 0.08)` }} />
        </div>
      </div>
    </div>
  </div>
);

// ─── Beautiful Themes visual ───────────────────────────────────────────────────

const THEME_PALETTES = [
  {
    accent: "#d4b896",
    bg: "linear-gradient(160deg, #111e2e 0%, #080f1c 55%, #050b14 100%)",
    border: "rgba(146,176,190,0.16)",
  },
  {
    accent: "#0a1729",
    bg: "linear-gradient(160deg, #fdfaf2 0%, #f5edda 55%, #ece0c0 100%)",
    border: "rgba(10,23,41,0.10)",
  },
  {
    accent: "#c49480",
    bg: "linear-gradient(160deg, #141010 0%, #0c0909 55%, #080606 100%)",
    border: "rgba(196,148,128,0.18)",
  },
  {
    accent: "#28a070",
    bg: "linear-gradient(160deg, #dff5ec 0%, #c2e8d8 55%, #a4d9c3 100%)",
    border: "rgba(40,130,95,0.30)",
  },
];

const BeautifulThemesVisual: React.FC = () => (
  <div className="mt-5 flex gap-1.5">
    {THEME_PALETTES.map(({ accent, bg, border }, i) => (
      <div
        className="relative flex-1 overflow-hidden rounded-lg"
        key={i}
        style={{
          background: bg,
          border: `1px solid ${border}`,
          paddingBottom: "0.75rem",
        }}
      >
        <div
          className="h-px w-full"
          style={{ background: `linear-gradient(to right, transparent, ${accent}cc, transparent)` }}
        />
        <div className="mx-auto mt-1.5 size-3 rounded-full" style={{ background: accent, opacity: 0.4 }} />
        <div className="mx-1.5 mt-1.5 space-y-1">
          {[0.4, 0.25, 0.15].map((op, j) => (
            <div className="h-1 rounded-sm" key={j} style={{ background: accent, opacity: op }} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ─── Shared card shell ─────────────────────────────────────────────────────────

const cardBase =
  "relative overflow-hidden rounded-2xl backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg";
const cardStyle: React.CSSProperties = {
  background: `var(--m-card-bg)`,
  border: `1px solid rgb(var(--m-muted) / 0.15)`,
};
const cardHoverClass = "hover:shadow-[0_10px_30px_rgb(var(--m-shadow)/0.12)]";

const accentBar = <div className="absolute inset-x-0 top-0 h-px" style={{ background: `var(--m-accent-gradient)` }} />;

type IconHeaderProps = { icon: React.ElementType; title: string };
const IconHeader: React.FC<IconHeaderProps> = ({ icon: Icon, title }) => (
  <div className="mb-4 flex items-center gap-3">
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-xl"
      style={{
        background: `var(--m-embed-bg)`,
        border: `1px solid rgb(var(--m-accent) / 0.20)`,
        boxShadow: `0 4px 12px rgb(var(--m-shadow) / 0.2)`,
      }}
    >
      <Icon className="size-4" strokeWidth={1.5} style={{ color: `rgb(var(--m-accent))` }} />
    </div>
    <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
  </div>
);

// ─── Features section ──────────────────────────────────────────────────────────

export const Features: React.FC<FeaturesProps> = ({ t }) => (
  <section className="px-6 py-24">
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-12 text-center text-2xl font-bold tracking-tight sm:text-3xl">
        {t("everythingYourLinkPageShouldBe")}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Blazing Fast — top-left */}
        <FadeIn className="sm:col-start-1 sm:row-start-1" delay={0}>
          <div className={`${cardBase} ${cardHoverClass} h-full p-6`} style={cardStyle}>
            {accentBar}
            <IconHeader icon={Zap} title={t("blazingFast")} />
            <p className="text-sm leading-relaxed" style={{ color: `rgb(var(--m-muted) / 0.7)` }}>
              {t("noWaitingRoomBetweenYouAndYourAudienceYourPageLoadsTheMomentTheyArrive")}
            </p>
            <BlazingFastVisual />
          </div>
        </FadeIn>

        {/* Beautiful Themes — bottom-left */}
        <FadeIn className="sm:col-start-1 sm:row-start-2" delay={100}>
          <div className={`${cardBase} ${cardHoverClass} h-full p-6`} style={cardStyle}>
            {accentBar}
            <IconHeader icon={Palette} title={t("beautifulThemes")} />
            <p className="text-sm leading-relaxed" style={{ color: `rgb(var(--m-muted) / 0.7)` }}>
              {t("aPageThatLooksAsIntentionalAsWhatYouCreateDesignsThatFeelHandcraftedNeverTemplated")}
            </p>
            <BeautifulThemesVisual />
          </div>
        </FadeIn>

        {/* Actionable Analytics — right column, spans both rows */}
        <FadeIn className="sm:col-start-2 sm:row-span-2 sm:row-start-1" delay={50}>
          <div className={`${cardBase} ${cardHoverClass} h-full p-7`} style={cardStyle}>
            {accentBar}
            <IconHeader icon={BarChart3} title={t("actionableAnalytics")} />
            <p className="mb-1 text-sm leading-relaxed" style={{ color: `rgb(var(--m-muted) / 0.7)` }}>
              {t("seeWhichLinksGetClickedAndWhereVisitorsComeFromCleanDataNoNoise")}
            </p>
            <AnalyticsPreview />
          </div>
        </FadeIn>

        {/* Redirect Hub — bottom-left */}
        <FadeIn className="sm:col-start-1 sm:row-start-3" delay={150}>
          <div className={`${cardBase} ${cardHoverClass} h-full p-6`} style={cardStyle}>
            {accentBar}
            <IconHeader icon={ArrowUpRight} title={t("redirectHub")} />
            <p className="mb-4 text-sm leading-relaxed" style={{ color: `rgb(var(--m-muted) / 0.7)` }}>
              {t("routeFollowersDirectlyToAnyPlatformWithASingleShortLinkNoProfileVisitRequired")}
            </p>
            <RedirectHubUrlPreview />
          </div>
        </FadeIn>

        {/* Custom Domains — bottom-right */}
        <FadeIn className="sm:col-start-2 sm:row-start-3" delay={200}>
          <div className={`${cardBase} ${cardHoverClass} h-full p-6`} style={cardStyle}>
            {accentBar}
            <IconHeader icon={Globe} title={t("customDomains")} />
            <p className="text-sm leading-relaxed" style={{ color: `rgb(var(--m-muted) / 0.7)` }}>
              {t("yourNameYourDomainYourCornerOfTheInternetALinkThatsPermanentlyAndUnmistakablyYours")}
            </p>
            {/* Domain mapping visual */}
            <div className="mt-4 flex items-center gap-2.5">
              <div
                className="rounded-lg px-3 py-1.5"
                style={{ background: `var(--m-embed-bg)`, border: `1px solid rgb(var(--m-muted) / 0.12)` }}
              >
                <span className="text-[11px] font-medium" style={{ color: `rgb(var(--m-muted) / 0.55)` }}>
                  marina.studio
                </span>
              </div>
              <ChevronRight
                className="size-3.5 shrink-0"
                strokeWidth={1.5}
                style={{ color: `rgb(var(--m-muted) / 0.25)` }}
              />
              <div
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                style={{ background: `rgb(var(--m-accent) / 0.05)`, border: `1px solid rgb(var(--m-accent) / 0.18)` }}
              >
                <Anchor className="size-3" strokeWidth={1.5} style={{ color: `rgb(var(--m-accent) / 0.55)` }} />
                <span className="text-[11px] font-medium" style={{ color: `rgb(var(--m-accent) / 0.60)` }}>
                  anchr
                </span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  </section>
);
