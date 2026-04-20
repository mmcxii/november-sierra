import { LinkPageMockup } from "@/components/marketing/link-page-mockup";
import { Container } from "@/components/ui/container";
import type { TFunction } from "i18next";
import Link from "next/link";

export type HeroProps = {
  t: TFunction;
};

export const Hero: React.FC<HeroProps> = (props) => {
  const { t } = props;

  return (
    <section className="relative pt-8 pb-16 lg:pt-12 lg:pb-24">
      {/* Ambient glow */}
      <div className="m-glow-bg pointer-events-none absolute inset-0 m-auto h-[600px] w-[600px] max-w-full rounded-full opacity-40 blur-[120px]" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-20">
          {/* Headline — row 1 on mobile, col 1 row 1 on desktop */}
          <h1 className="text-center text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:col-start-1 lg:row-start-1 lg:text-left lg:text-6xl">
            {t("yourLinkInBioAndYourUrlShortenerAllInOneTool")}
          </h1>

          {/* Mockup — row 2 on mobile, col 2 spanning rows 1–2 on desktop */}
          <div className="flex justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <LinkPageMockup />
          </div>

          {/* Subtext + auth links — row 3 on mobile, col 1 row 2 on desktop */}
          <div className="flex flex-col items-center gap-10 lg:col-start-1 lg:row-start-2 lg:items-start">
            <p className="m-muted-80 mx-auto max-w-lg text-lg leading-relaxed sm:text-xl lg:mx-0">
              {t("everyLinkYouShareAllInOnePlace")}
            </p>
            <div className="flex flex-col items-center gap-4 lg:items-start">
              <span className="m-accent-12-bg m-accent-color rounded-full px-3 py-1 text-xs font-semibold">
                {t("signUpAndGetYourFirstMonthOfProFree")}
              </span>
              <div className="flex items-center gap-4">
                <Link
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-md px-6 text-sm font-medium transition-colors"
                  href="/sign-up"
                >
                  {t("getStarted")}
                </Link>
                <Link
                  className="border-primary/40 text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground inline-flex h-10 items-center rounded-md border bg-transparent px-6 text-sm font-medium transition-colors"
                  href="/sign-in"
                >
                  {t("signIn")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
