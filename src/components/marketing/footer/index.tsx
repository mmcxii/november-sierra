import type { TFunction } from "i18next";
import { Anchor } from "lucide-react";
import Link from "next/link";

export type FooterProps = {
  t: TFunction;
};

export const Footer: React.FC<FooterProps> = (props) => {
  const { t } = props;

  return (
    <footer className="px-6 py-8" style={{ borderTop: `1px solid rgb(var(--m-muted) / 0.10)` }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2" style={{ color: `rgb(var(--m-muted) / 0.6)` }}>
          <Anchor className="size-4" strokeWidth={1.5} />
          <span className="text-sm font-semibold">{t("anchr")}</span>
        </div>
        <div className="flex items-center gap-6">
          <Link className="text-xs transition-colors" href="/privacy" style={{ color: `rgb(var(--m-muted) / 0.4)` }}>
            {t("privacyPolicy")}
          </Link>
          <p className="text-xs" style={{ color: `rgb(var(--m-muted) / 0.4)` }}>
            &copy; {new Date().getFullYear()} {t("anchr")}. {t("allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
};
