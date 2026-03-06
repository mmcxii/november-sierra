"use client";

import { SiteLogo } from "@/components/marketing/site-logo";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

export type DashboardErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const DashboardErrorPage: React.FC<DashboardErrorPageProps> = (props) => {
  const { reset } = props;
  const [t] = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24" data-marketing-theme="dark">
      <div className="flex max-w-sm flex-col items-center text-center">
        {/* Logo — tilted to convey "off-kilter" state */}
        <div className="mb-6">
          <SiteLogo accent="146 176 190" cardBg="rgba(30, 45, 66, 0.6)" className="-rotate-12" size="sm" />
        </div>

        {/* Heading */}
        <h1 className="mb-3 text-xl font-semibold tracking-tight text-white">{t("somethingWentWrong")}</h1>

        {/* Description */}
        <p className="mb-8 text-sm leading-relaxed text-[#92b0be]/80">
          {t("weHitUnexpectedWatersPleaseTryAgainAndIfTheIssuePersistsWeAreAlreadyOnIt")}
        </p>

        {/* CTA */}
        <Button onClick={reset}>
          <RefreshCw className="size-4" />
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
};

export default DashboardErrorPage;
