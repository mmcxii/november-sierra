import { SiteLogo } from "@/components/marketing/site-logo";
import { Container } from "@/components/ui/container";
import type { TFunction } from "i18next";
import Link from "next/link";

export type CtaProps = {
  t: TFunction;
};

export const Cta: React.FC<CtaProps> = (props) => {
  const { t } = props;

  return (
    <section className="relative py-24">
      {/* Ambient glow */}
      <div className="m-glow-bg pointer-events-none absolute inset-0 m-auto h-[500px] w-[500px] max-w-full rounded-full opacity-40 blur-[120px]" />

      {/* Logo watermark */}
      <div className="pointer-events-none absolute inset-0 m-auto flex h-28 w-28 scale-[3] items-center justify-center opacity-[0.08] sm:scale-[4]">
        <SiteLogo size="lg" />
      </div>

      <Container className="relative z-10 flex flex-col items-center text-center">
        <h2 className="mb-10 text-2xl font-bold tracking-tight sm:text-3xl">{t("readyToDropAnchor")}</h2>
        <Link
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-md px-6 text-sm font-medium transition-colors"
          href="/sign-up"
        >
          {t("getStarted")}
        </Link>
      </Container>
    </section>
  );
};
