import type { TFunction } from "i18next";

import { LinkPageMockup } from "@/components/marketing/link-page-mockup";
import { SiteLogo } from "@/components/marketing/site-logo";
import { SiteWordmark } from "@/components/marketing/site-wordmark";
import { WaitlistForm } from "@/components/marketing/waitlist-form";

export type HeroProps = {
  t: TFunction;
};

export const Hero: React.FC<HeroProps> = (props) => {
  const { t } = props;

  return (
    <section className="relative px-6 pt-16 pb-16 lg:pt-20 lg:pb-24">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[120px]"
        style={{ background: `rgb(var(--m-glow))` }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Site logo */}
        <div className="mb-10 flex flex-col items-center gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:gap-5">
            <SiteLogo size="md" />
            <div className="hidden h-7 w-px lg:block" style={{ background: `rgb(var(--m-accent) / 0.25)` }} />
            <SiteWordmark size="md" />
          </div>
          <p className="text-center text-sm font-medium tracking-[0.22em] uppercase lg:text-right">
            {t("yourHarborForEveryConnection")}
          </p>
        </div>

        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-20">
          {/* h1 — row 1 on mobile, col 1 row 1 on desktop */}
          <h1 className="text-center text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:col-start-1 lg:row-start-1 lg:text-left lg:text-6xl">
            {t("finallyALinkPageWorthSharing")}
          </h1>

          {/* Mockup — row 2 on mobile, col 2 spanning rows 1–2 on desktop */}
          <div className="flex justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <LinkPageMockup />
          </div>

          {/* Subtext + form — row 3 on mobile, col 1 row 2 on desktop */}
          <div className="flex flex-col items-center gap-10 lg:col-start-1 lg:row-start-2 lg:items-start">
            <p
              className="mx-auto max-w-lg text-lg leading-relaxed sm:text-xl lg:mx-0"
              style={{ color: `rgb(var(--m-muted) / 0.8)` }}
            >
              {t("everythingThatMattersToYouAllInOnePlace")}
            </p>
            <div className="relative flex flex-col items-center gap-3 lg:items-start">
              <WaitlistForm />
              <p className="text-xs" style={{ color: `rgb(var(--m-muted) / 0.4)` }}>
                {t("wellReachOutWhenWereReadyNoSpamEver")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
