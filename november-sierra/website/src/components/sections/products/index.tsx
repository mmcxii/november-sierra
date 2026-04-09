"use client";

import { useSectionReveal } from "@/hooks/use-section-reveal";
import { ANCHR_OG_IMAGE, ANCHR_URL } from "@/lib/constants";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export const Products: React.FC = () => {
  //* State
  const { t } = useTranslation();

  //* Refs
  const ref = useSectionReveal();

  return (
    <section className="px-6 py-24 md:px-12" id="products">
      <div className="section-reveal mx-auto max-w-4xl" ref={ref}>
        <h2 className="text-ns-text-heading mb-12 text-center font-serif text-3xl md:text-4xl">{t("products")}</h2>

        <a
          className="group border-ns-card-border bg-ns-card-bg block overflow-hidden rounded-lg border transition-all duration-300"
          href={ANCHR_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <div className="overflow-hidden">
            <Image
              alt={`${t("anchr")} — ${t("yourHarborForEveryConnection")}`}
              className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              height={630}
              src={ANCHR_OG_IMAGE}
              width={1200}
            />
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-ns-text-heading font-serif text-2xl font-bold">{t("anchr")}</h3>
              <ExternalLink
                aria-hidden="true"
                className="text-ns-accent transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                size={18}
              />
            </div>
            <p className="text-ns-text text-lg">
              {t("aCustomizableLinkInBioWithAFullThemeStudioBuiltInAnalyticsADeveloperApiAndAiAgentIntegrationViaMcp")}
            </p>
          </div>
        </a>
      </div>
    </section>
  );
};
