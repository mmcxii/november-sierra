import type { TFunction } from "i18next";

import { SiteLogo } from "@/components/marketing/site-logo";
import { WaitlistForm } from "@/components/marketing/waitlist-form";

export type CtaProps = {
  t: TFunction;
};

export const Cta: React.FC<CtaProps> = (props) => {
  const { t } = props;

  return (
    <section className="relative px-6 py-24">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[120px]"
        style={{ background: `rgb(var(--m-glow))` }}
      />

      {/* Logo watermark */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[4] opacity-[0.08]">
        <SiteLogo size="lg" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <h2 className="mb-10 text-2xl font-bold tracking-tight sm:text-3xl">
          {t("joinTodayBuildOnLaunchDayShareForever")}
        </h2>
        <WaitlistForm />
      </div>
    </section>
  );
};
