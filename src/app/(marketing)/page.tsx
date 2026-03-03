import { Cta } from "@/components/marketing/cta";
import { Features } from "@/components/marketing/features";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { initTranslations } from "@/lib/i18n/server";

const MarketingPage: React.FC = async () => {
  const { t } = await initTranslations("en-US");

  return (
    <>
      <Hero t={t} />
      <Features t={t} />
      <Cta t={t} />
      <Footer t={t} />
    </>
  );
};

export default MarketingPage;
