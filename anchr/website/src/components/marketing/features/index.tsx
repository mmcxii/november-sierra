"use client";

import { AnalyticsPreview } from "@/components/marketing/analytics-preview";
import { FadeIn } from "@/components/marketing/fade-in";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { Anchor, BarChart3, ChevronRight, Code, Globe, Heart, Palette } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BeautifulThemesVisual } from "./beautiful-themes-visual";
import { cardBase, cardClasses, cardHoverClass } from "./card-styles";
import { DeveloperApiVisual } from "./developer-api-visual";
import { IconHeader } from "./icon-header";
import { OpenSourceVisual } from "./open-source-visual";

export const Features: React.FC = () => {
  //* State
  const { t } = useTranslation();

  return (
    <Container as="section" className="py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center text-2xl font-bold tracking-tight sm:text-3xl">
          {t("linksThatActuallyConnect")}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Beautiful Themes — top-left */}
          <FadeIn className="sm:col-start-1 sm:row-start-1" delay={0}>
            <div className={cn(cardBase, cardClasses, cardHoverClass, "h-full p-6")}>
              <div className="m-accent-gradient-bg absolute inset-x-0 top-0 h-px" />
              <IconHeader icon={Palette} title={t("beautifulThemes")} />
              <p className="m-muted-70 text-sm leading-relaxed">
                {t("themesDesignedToLookGreatOutOfTheBoxAndAFullStudioForThoseWhoWantEveryDetailToMatchTheirBrand")}
              </p>
              <BeautifulThemesVisual />
            </div>
          </FadeIn>

          {/* Actionable Analytics — right column, spans both rows (hero) */}
          <FadeIn className="sm:col-start-2 sm:row-span-2 sm:row-start-1" delay={50}>
            <div className={cn(cardBase, cardClasses, cardHoverClass, "h-full p-7")}>
              <div className="m-accent-gradient-bg absolute inset-x-0 top-0 h-px" />
              <IconHeader icon={BarChart3} title={t("actionableAnalytics")} />
              <p className="m-muted-70 mb-1 text-sm leading-relaxed">
                {t("seeWhichLinksGetClickedAndWhereVisitorsComeFromCleanDataNoNoise")}
              </p>
              <AnalyticsPreview />
            </div>
          </FadeIn>

          {/* Developer API — below themes, left column */}
          <FadeIn className="sm:col-start-1 sm:row-start-2" delay={100}>
            <div className={cn(cardBase, cardClasses, cardHoverClass, "h-full p-6")}>
              <div className="m-accent-gradient-bg absolute inset-x-0 top-0 h-px" />
              <IconHeader icon={Code} title={t("developerApi")} />
              <p className="m-muted-70 text-sm leading-relaxed">
                {t("restApiWebhooksAndMcpBuildOnYourLinkInBioWithCodeScriptsOrAiAgents")}
              </p>
              <DeveloperApiVisual />
            </div>
          </FadeIn>

          {/* Open Source — bottom-left */}
          <FadeIn className="sm:col-start-1 sm:row-start-3" delay={150}>
            <div className={cn(cardBase, cardClasses, cardHoverClass, "h-full p-6")}>
              <div className="m-accent-gradient-bg absolute inset-x-0 top-0 h-px" />
              <IconHeader icon={Heart} title={t("openSource")} />
              <p className="m-muted-70 text-sm leading-relaxed">{t("openSourceBecauseTrustIsEarned")}</p>
              <OpenSourceVisual />
            </div>
          </FadeIn>

          {/* Custom Domains — bottom-right */}
          <FadeIn className="sm:col-start-2 sm:row-start-3" delay={200}>
            <div className={cn(cardBase, cardClasses, cardHoverClass, "h-full p-6")}>
              <div className="m-accent-gradient-bg absolute inset-x-0 top-0 h-px" />
              <IconHeader icon={Globe} title={t("customDomains")} />
              <p className="m-muted-70 text-sm leading-relaxed">
                {t("yourNameYourDomainYourCornerOfTheInternetALinkThatsPermanentlyAndUnmistakablyYours")}
              </p>
              {/* Domain mapping visual */}
              <div className="mt-4 flex items-center gap-2.5">
                <div className="m-embed-bg-bg m-muted-12-border rounded-lg px-3 py-1.5">
                  {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- domain name in mockup */}
                  <span className="m-muted-bg-55-color text-[11px] font-medium">marina.studio</span>
                </div>
                <ChevronRight className="m-muted-25 size-3.5 shrink-0" strokeWidth={1.5} />
                <div className="m-accent-05-bg m-accent-18-border flex items-center gap-1.5 rounded-lg px-3 py-1.5">
                  <Anchor className="m-accent-55-color size-3" strokeWidth={1.5} />
                  {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- brand name in mockup */}
                  <span className="m-accent-60-color text-[11px] font-medium">anchr</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </Container>
  );
};
