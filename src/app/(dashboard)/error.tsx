"use client";

import { Button } from "@/components/ui/button";
import { Anchor, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

export type DashboardErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const DashboardErrorPage: React.FC<DashboardErrorPageProps> = (props) => {
  const { reset } = props;
  const [t] = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="flex max-w-sm flex-col items-center text-center">
        {/* Compact anchor icon — tilted */}
        <div className="mb-6">
          <div className="flex size-14 -rotate-12 items-center justify-center rounded-xl border border-[#92b0be]/15 bg-[#1e2d42]/60">
            <Anchor className="size-6 text-[#92b0be]/60" strokeWidth={1.5} />
          </div>
        </div>

        {/* Heading */}
        <h1 className="mb-3 text-xl font-semibold tracking-tight text-white">{t("somethingWentWrong")}</h1>

        {/* Description */}
        <p className="mb-8 text-sm leading-relaxed text-[#92b0be]/80">
          {t("weHitUnexpectedWatersPleaseTryAgainAndIfTheIssuePersistsWeAreAlreadyOnIt")}
        </p>

        {/* CTA */}
        <Button
          className="border border-[#92b0be]/30 bg-[#1e2d42] text-white hover:border-[#92b0be]/50 hover:bg-[#2d3e56]"
          onClick={reset}
        >
          <RefreshCw className="size-4" />
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
};

export default DashboardErrorPage;
