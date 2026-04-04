import { SiteBrandmark } from "@/components/marketing/site-brandmark";
import { Container } from "@/components/ui/container";
import { initTranslations } from "@/lib/i18n/server";
import Link from "next/link";
import { NAV_LINKS } from "./constants";
import { MobileMenu } from "./mobile-menu";

export const SiteHeader: React.FC = async () => {
  const { t } = await initTranslations("en-US");

  return (
    <Container as="header" className="relative z-10 flex items-center justify-between py-6">
      <Link className="group inline-flex items-center" href="/">
        <SiteBrandmark as="h1" className="transition-opacity group-hover:opacity-75" size="sm" />
      </Link>
      <nav className="flex items-center gap-6">
        {NAV_LINKS.map((link) => {
          return (
            <Link
              className="m-muted-70 hidden text-sm font-medium transition-colors hover:opacity-100 sm:inline"
              href={link.href}
              key={link.href}
            >
              {t(link.labelKey)}
            </Link>
          );
        })}
        <Link
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors"
          href="/sign-up"
        >
          {t("signUp")}
        </Link>
        <MobileMenu />
      </nav>
    </Container>
  );
};
