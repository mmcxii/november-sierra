import { Home } from "lucide-react";
import Link from "next/link";

import { SiteLogo } from "@/components/marketing/site-logo";
import { SiteWordmark } from "@/components/marketing/site-wordmark";
import { Button } from "@/components/ui/button";
import { initTranslations } from "@/lib/i18n/server";

const WelcomePage: React.FC = async () => {
  const { t } = await initTranslations("en-US");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(var(--m-glow))] opacity-40 blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        {/* Logo + Wordmark lockup with sway animation */}
        <div className="mb-10 animate-[sway_4s_ease-in-out_infinite]">
          <div className="flex flex-col items-center gap-4">
            <SiteLogo size="lg" />
            <SiteWordmark size="lg" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-[rgb(var(--m-text))]">{t("welcomeAboard")}</h1>

        {/* Accent divider */}
        <div className="mx-auto mb-6 h-px w-16" style={{ background: `var(--m-accent-gradient)` }} />

        {/* Description */}
        <p className="mb-10 leading-relaxed text-[rgb(var(--m-muted))]/80">
          {t("youreOnTheListWellSendWordWhenItsTimeToSetSailUntilThenSitTightCaptain")}
        </p>

        {/* CTA */}
        <Button
          asChild
          className="h-11 gap-2 px-6 font-medium"
          style={{
            background: `rgb(var(--m-accent))`,
            color: `var(--m-page-bg)`,
          }}
        >
          <Link href="/">
            <Home className="size-4" />
            {t("returnHome")}
          </Link>
        </Button>
      </div>

      {/* Sway keyframes */}
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
