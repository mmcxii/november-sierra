import { TypewriterUrlVisual } from "@/components/marketing/typewriter-url-visual";
import { Container } from "@/components/ui/container";
import type { TFunction } from "i18next";
import Link from "next/link";

export type ShortLinksHeroProps = {
  t: TFunction;
};

export const ShortLinksHero: React.FC<ShortLinksHeroProps> = (props) => {
  const { t } = props;

  return (
    <section className="relative pt-8 pb-16 lg:pt-12 lg:pb-20">
      {/* Ambient glow — mirror of homepage hero */}
      <div className="m-glow-bg pointer-events-none absolute inset-0 m-auto h-[500px] w-[500px] max-w-full rounded-full opacity-30 blur-[120px]" />

      <Container className="relative z-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
          <h1 className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("aUrlShortenerYouCanUseRightNowOrMakeEntirelyYourOwn")}
          </h1>
          <p className="m-muted-80 max-w-xl text-lg leading-relaxed sm:text-xl">
            {t("shortUrlsInSecondsCustomizableAsYouSeeFit")}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-md px-6 text-sm font-medium transition-colors"
              href="/sign-up?source=short-links"
            >
              {t("shortenYourFirstUrl")}
            </Link>
            <Link
              className="border-primary/40 text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground inline-flex h-10 items-center rounded-md border bg-transparent px-6 text-sm font-medium transition-colors"
              href="#how-it-works"
            >
              {t("seeHowItWorks")}
            </Link>
          </div>

          {/* Typewriter visual */}
          <div className="mt-4 flex w-full justify-center">
            <TypewriterUrlVisual />
          </div>
        </div>
      </Container>
    </section>
  );
};
