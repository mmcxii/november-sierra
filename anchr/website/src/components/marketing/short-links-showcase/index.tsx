import { TypewriterUrlVisual } from "@/components/marketing/typewriter-url-visual";
import { Container } from "@/components/ui/container";
import type { TFunction } from "i18next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export type ShortLinksShowcaseProps = {
  t: TFunction;
};

/**
 * Short Links showcase section on the homepage. Sits between the features
 * grid and the bottom CTA. Visual-left + copy-right layout reverses the
 * main hero's copy-left orientation so the page reads with varied rhythm
 * as the eye scrolls down. Typewriter URL visual is shared with the
 * `/short-links` hero.
 */
export const ShortLinksShowcase: React.FC<ShortLinksShowcaseProps> = (props) => {
  const { t } = props;

  return (
    <Container as="section" className="py-24">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Visual — col 1 on desktop (reversed from hero) */}
        <div className="flex justify-center lg:order-1 lg:justify-start">
          <TypewriterUrlVisual />
        </div>

        {/* Copy + CTA — col 2 on desktop */}
        <div className="flex flex-col items-center gap-6 text-center lg:order-2 lg:items-start lg:text-left">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("aUrlShortenerToMatch")}</h2>
          <p className="m-muted-70 max-w-md text-base leading-relaxed sm:text-lg">
            {t("turnAnyLinkIntoACleanShortUrlOnAnchToCustomSlugsPasswordsExpiryAndHonestAnalyticsAllInOneDashboard")}
          </p>
          <Link
            className="text-primary hover:text-primary/80 inline-flex items-center gap-2 text-sm font-medium transition-colors"
            href="/short-links"
          >
            {t("seeHowShortLinksWork")}
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </Container>
  );
};
