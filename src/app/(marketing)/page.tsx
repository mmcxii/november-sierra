import { JsonLd } from "@/components/json-ld";
import { Cta } from "@/components/marketing/cta";
import { Features } from "@/components/marketing/features";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { envSchema } from "@/lib/env";
import { initTranslations } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description:
    "Anchr brings your scattered profiles, payment handles, and important links into one beautiful, blazing-fast page you actually own.",
};

const MarketingPage: React.FC = async () => {
  const { t } = await initTranslations("en-US");
  const baseUrl = envSchema.NEXT_PUBLIC_APP_URL;

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    alternateName: "Anchr.to",
    description:
      "Anchr brings your scattered profiles, payment handles, and important links into one beautiful, blazing-fast page you actually own.",
    name: "Anchr",
    url: baseUrl,
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    description: "A link-in-bio tool that helps you own your online presence.",
    name: "Anchr",
    url: baseUrl,
  };

  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={organizationJsonLd} />
      <Hero t={t} />
      <Features />
      <Cta t={t} />
      <Footer t={t} />
    </>
  );
};

export default MarketingPage;
