import type { TFunction } from "i18next";
import { Anchor } from "lucide-react";
import Link from "next/link";

export type FooterProps = {
  t: TFunction;
};

export const Footer: React.FC<FooterProps> = (props) => {
  const { t } = props;

  return (
    <footer className="m-border-top-muted px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="m-muted-60 flex items-center gap-2">
          <Anchor className="size-4" strokeWidth={1.5} />
          <span className="text-sm font-semibold">{t("anchr")}</span>
        </div>
        <div className="flex items-center gap-6">
          <Link className="m-muted-40 text-xs transition-colors" href="/pricing">
            {t("pricing")}
          </Link>
          <Link className="m-muted-40 text-xs transition-colors" href="/legal/privacy">
            {t("privacyPolicy")}
          </Link>
          <Link className="m-muted-40 text-xs transition-colors" href="/legal/terms">
            {t("termsOfService")}
          </Link>
          <p className="m-muted-40 text-xs">
            &copy; {new Date().getFullYear()} {t("anchr")}. {t("allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
};
