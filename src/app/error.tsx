"use client";

import { SiteLogo } from "@/components/marketing/site-logo";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

export type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ErrorPage: React.FC<ErrorPageProps> = (props) => {
  const { reset } = props;

  //* State
  const [t] = useTranslation();

  return (
    <div
      className="bg-anc-deep-navy relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
      data-marketing-theme="dark"
    >
      {/* Ambient glow — shifted warm to signal error state */}
      <div className="bg-anc-error-glow pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        {/* Logo — tilted to convey "off-kilter" state */}
        <div className="mb-8">
          <SiteLogo accent="146 176 190" cardBg="rgba(30, 45, 66, 0.6)" className="-rotate-12" />
        </div>

        {/* Error code */}
        <p className="text-anc-steel tracking-anc-caps mb-3 font-mono text-sm">500</p>

        {/* Heading */}
        <h1 className="text-anc-cream mb-4 text-2xl font-semibold tracking-tight">{t("somethingWentWrong")}</h1>

        {/* Description */}
        <p className="text-anc-steel/80 mb-10 leading-relaxed">
          {t("weHitUnexpectedWatersPleaseTryAgainAndIfTheIssuePersistsWereAlreadyOnIt")}
        </p>

        {/* CTA */}
        <Button onClick={reset} size="lg">
          <RefreshCw className="size-4" />
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
};

export default ErrorPage;
