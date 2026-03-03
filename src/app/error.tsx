"use client";

import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SiteLogo } from "@/components/marketing/site-logo";
import { Button } from "@/components/ui/button";

export type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ErrorPage: React.FC<ErrorPageProps> = (props) => {
  const { reset } = props;

  //* State
  const [t] = useTranslation();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a1729] px-6">
      {/* Ambient glow — shifted warm to signal error state */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2d1a1a] opacity-30 blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        {/* Logo — tilted to convey "off-kilter" state */}
        <div className="mb-8">
          <SiteLogo accent="146 176 190" cardBg="rgba(30, 45, 66, 0.6)" className="-rotate-12" />
        </div>

        {/* Error code */}
        <p className="mb-3 font-mono text-sm tracking-[0.3em] text-[#92b0be]">500</p>

        {/* Heading */}
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-white">{t("somethingWentWrong")}</h1>

        {/* Description */}
        <p className="mb-10 leading-relaxed text-[#92b0be]/80">
          {t("weHitUnexpectedWatersPleaseTryAgainAndIfTheIssuePersistsWeAreAlreadyOnIt")}
        </p>

        {/* CTA */}
        <Button
          className="border border-[#92b0be]/30 bg-[#1e2d42] text-white hover:border-[#92b0be]/50 hover:bg-[#2d3e56]"
          onClick={reset}
          size="lg"
        >
          <RefreshCw className="size-4" />
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
};

export default ErrorPage;
