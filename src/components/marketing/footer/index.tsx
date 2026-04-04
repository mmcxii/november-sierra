import { Container } from "@/components/ui/container";
import type { TFunction } from "i18next";
import { Anchor } from "lucide-react";
import Link from "next/link";

export type FooterProps = {
  t: TFunction;
};

export const Footer: React.FC<FooterProps> = (props) => {
  const { t } = props;

  return (
    <Container
      as="footer"
      className="m-border-top-muted flex flex-col items-center justify-between gap-4 py-8 sm:flex-row"
    >
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
        <Link
          className="m-muted-40 text-xs transition-colors"
          href="https://github.com/mmcxii/anchr"
          rel="noopener noreferrer"
          target="_blank"
        >
          {t("github")}
        </Link>
        {/* eslint-disable-next-line anchr/no-raw-string-jsx -- copyright punctuation around translated values */}
        <p className="m-muted-40 text-xs">
          &copy; {new Date().getFullYear()} {t("anchr")}. {t("allRightsReserved")}
        </p>
      </div>
    </Container>
  );
};
