import { Footer } from "@/components/marketing/footer";
import { ShortLinksComparison } from "@/components/marketing/short-links-landing/comparison";
import { ShortLinksFeaturesGrid } from "@/components/marketing/short-links-landing/features-grid";
import { ShortLinksHero } from "@/components/marketing/short-links-landing/hero";
import { HowItWorks } from "@/components/marketing/short-links-landing/how-it-works";
import { SiteHeader } from "@/components/marketing/site-header";
import { initTranslations } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description:
    "Anchr's URL shortener. Use it on anch.to, on your own domain, password-protect links, set expiry dates, and see every click. $7/mo Pro or free forever.",
  title: "URL Shortener",
};

const ShortLinksPage: React.FC = async () => {
  const { t } = await initTranslations("en-US");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <ShortLinksHero t={t} />
        <HowItWorks t={t} />
        <ShortLinksFeaturesGrid t={t} />
        <ShortLinksComparison t={t} />
      </main>
      <Footer t={t} />
    </div>
  );
};

export default ShortLinksPage;
