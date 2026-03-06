"use client";

import { AnalyticsPreview } from "@/components/marketing/analytics-preview";
import { FadeIn } from "@/components/marketing/fade-in";
import { RedirectHubUrlPreview } from "@/components/marketing/redirect-hub-url-preview";
import { cn } from "@/lib/utils";
import { Anchor, ArrowUpRight, BarChart3, ChevronRight, Globe, Palette, Zap } from "lucide-react";
import { type RefCallback, useCallback } from "react";
import { useTranslation } from "react-i18next";

/** Sets multiple CSS properties on an element via a ref callback. */
function useStyleRef(styles: Record<string, string>): RefCallback<HTMLElement> {
  const serialized = JSON.stringify(styles);
  return useCallback(
    (el: null | HTMLElement) => {
      if (!el) {
        return;
      }
      for (const [prop, value] of Object.entries(styles)) {
        el.style.setProperty(prop, value);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serialized],
  );
}

// ─── Blazing Fast visual ───────────────────────────────────────────────────────

const BlazingFastVisual: React.FC = () => (
  <div className="mt-5">
    <div className="m-embed-bg-bg m-embed-border overflow-hidden rounded-xl">
      {/* Loading bar */}
      <div className="h-[2px]">
        <div className="m-accent-bg h-full [animation:speed-bar_4s_ease-in-out_infinite]" />
      </div>
      {/* Page content that appears */}
      <div className="[animation:speed-content_4s_ease-in-out_infinite] space-y-2.5 px-5 py-4">
        <div className="m-accent-bg-22 mx-auto size-6 rounded-full" />
        <div className="space-y-1.5">
          <div className="m-accent-16-bg h-2 rounded-full" />
          <div className="m-muted-bg-10 h-2 rounded-full" />
          <div className="m-muted-bg-08 h-2 rounded-full" />
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

const ThemeSwatch: React.FC<{ accent: string; bg: string; border: string }> = ({ accent, bg, border }) => {
  const cardRef = useStyleRef({ background: bg, border: `1px solid ${border}` });
  const hairRef = useStyleRef({ background: `linear-gradient(to right, transparent, ${accent}cc, transparent)` });
  const dotRef = useStyleRef({ background: accent, opacity: "0.4" });

  return (
    <div className="relative flex-1 overflow-hidden rounded-lg pb-3" ref={cardRef}>
      <div className="h-px w-full" ref={hairRef} />
      <div className="mx-auto mt-1.5 size-3 rounded-full" ref={dotRef} />
      <div className="mx-1.5 mt-1.5 space-y-1">
        {[0.4, 0.25, 0.15].map((op, j) => (
          <ThemeBar accent={accent} key={j} opacity={op} />
        ))}
      </div>
    </div>
  );
};

const ThemeBar: React.FC<{ accent: string; opacity: number }> = ({ accent, opacity }) => {
  const ref = useStyleRef({ background: accent, opacity: String(opacity) });
  return <div className="h-1 rounded-sm" ref={ref} />;
};

const BeautifulThemesVisual: React.FC = () => (
  <div className="mt-5 flex gap-1.5">
    {THEME_PALETTES.map((palette, i) => (
      <ThemeSwatch key={i} {...palette} />
    ))}
  </div>
);

// ─── Shared card shell ─────────────────────────────────────────────────────────

const cardBase =
  "relative overflow-hidden rounded-2xl backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg";
const cardClasses = "m-card-bg-bg m-card-border";
const cardHoverClass = "hover:shadow-[0_10px_30px_rgb(var(--m-shadow)/0.12)]";

const accentBar = <div className="m-accent-gradient-bg absolute inset-x-0 top-0 h-px" />;

type IconHeaderProps = { icon: React.ElementType; title: string };
const IconHeader: React.FC<IconHeaderProps> = ({ icon: Icon, title }) => (
  <div className="mb-4 flex items-center gap-3">
    <div className="m-icon-box flex size-10 shrink-0 items-center justify-center rounded-xl">
      <Icon className="m-accent-color size-4" strokeWidth={1.5} />
    </div>
    <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
  </div>
);

// ─── Features section ──────────────────────────────────────────────────────────

export const Features: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center text-2xl font-bold tracking-tight sm:text-3xl">
          {t("everythingYourLinkPageShouldBe")}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Blazing Fast — top-left */}
          <FadeIn className="sm:col-start-1 sm:row-start-1" delay={0}>
            <div className={cn(cardBase, cardClasses, cardHoverClass, "h-full p-6")}>
              {accentBar}
              <IconHeader icon={Zap} title={t("blazingFast")} />
              <p className="m-muted-70 text-sm leading-relaxed">
                {t("noWaitingRoomBetweenYouAndYourAudienceYourPageLoadsTheMomentTheyArrive")}
              </p>
              <BlazingFastVisual />
            </div>
          </FadeIn>

          {/* Beautiful Themes — bottom-left */}
          <FadeIn className="sm:col-start-1 sm:row-start-2" delay={100}>
            <div className={cn(cardBase, cardClasses, cardHoverClass, "h-full p-6")}>
              {accentBar}
              <IconHeader icon={Palette} title={t("beautifulThemes")} />
              <p className="m-muted-70 text-sm leading-relaxed">
                {t("aPageThatLooksAsIntentionalAsWhatYouCreateDesignsThatFeelHandcraftedNeverTemplated")}
              </p>
              <BeautifulThemesVisual />
            </div>
          </FadeIn>

          {/* Actionable Analytics — right column, spans both rows */}
          <FadeIn className="sm:col-start-2 sm:row-span-2 sm:row-start-1" delay={50}>
            <div className={cn(cardBase, cardClasses, cardHoverClass, "h-full p-7")}>
              {accentBar}
              <IconHeader icon={BarChart3} title={t("actionableAnalytics")} />
              <p className="m-muted-70 mb-1 text-sm leading-relaxed">
                {t("seeWhichLinksGetClickedAndWhereVisitorsComeFromCleanDataNoNoise")}
              </p>
              <AnalyticsPreview />
            </div>
          </FadeIn>

          {/* Redirect Hub — bottom-left */}
          <FadeIn className="sm:col-start-1 sm:row-start-3" delay={150}>
            <div className={cn(cardBase, cardClasses, cardHoverClass, "h-full p-6")}>
              {accentBar}
              <IconHeader icon={ArrowUpRight} title={t("redirectHub")} />
              <p className="m-muted-70 mb-4 text-sm leading-relaxed">
                {t("routeFollowersDirectlyToAnyPlatformWithASingleShortLinkNoProfileVisitRequired")}
              </p>
              <RedirectHubUrlPreview />
            </div>
          </FadeIn>

          {/* Custom Domains — bottom-right */}
          <FadeIn className="sm:col-start-2 sm:row-start-3" delay={200}>
            <div className={cn(cardBase, cardClasses, cardHoverClass, "h-full p-6")}>
              {accentBar}
              <IconHeader icon={Globe} title={t("customDomains")} />
              <p className="m-muted-70 text-sm leading-relaxed">
                {t("yourNameYourDomainYourCornerOfTheInternetALinkThatsPermanentlyAndUnmistakablyYours")}
              </p>
              {/* Domain mapping visual */}
              <div className="mt-4 flex items-center gap-2.5">
                <div className="m-embed-bg-bg m-muted-12-border rounded-lg px-3 py-1.5">
                  <span className="m-muted-bg-55-color text-[11px] font-medium">marina.studio</span>
                </div>
                <ChevronRight className="m-muted-25 size-3.5 shrink-0" strokeWidth={1.5} />
                <div className="m-accent-05-bg m-accent-18-border flex items-center gap-1.5 rounded-lg px-3 py-1.5">
                  <Anchor className="m-accent-55-color size-3" strokeWidth={1.5} />
                  <span className="m-accent-60-color text-[11px] font-medium">anchr</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};
