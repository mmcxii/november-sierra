"use client";

import { useSectionReveal } from "@/hooks/use-section-reveal";
import { useTranslation } from "react-i18next";

export const About: React.FC = () => {
  //* State
  const { t } = useTranslation();

  //* Refs
  const ref = useSectionReveal();

  return (
    <section className="flex min-h-[50vh] items-center justify-center px-6 py-24 md:px-12" id="about">
      <div className="section-reveal max-w-2xl text-center" ref={ref}>
        <blockquote className="text-ns-text-heading font-serif text-xl leading-relaxed italic md:text-2xl lg:text-3xl">
          {t("buildingProductsWithIntuitiveInterfacesDesignedForPeopleAndCleanApisDesignedForAgents")}
        </blockquote>
      </div>
    </section>
  );
};
