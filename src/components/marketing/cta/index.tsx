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
        className="pointer-events-none absolute inset-0 m-auto h-[500px] w-[500px] max-w-full rounded-full opacity-40 blur-[120px]"
        style={{ background: `rgb(var(--m-glow))` }}
      />

      {/* Logo watermark */}
      <div className="pointer-events-none absolute inset-0 m-auto flex h-28 w-28 scale-[3] items-center justify-center opacity-[0.08] sm:scale-[4]">
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
