import { FadeIn } from "@/components/marketing/fade-in";
import { Footer } from "@/components/marketing/footer";
import { PricingCards } from "@/components/marketing/pricing-toggle";
import { SiteHeader } from "@/components/marketing/site-header";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { initTranslations } from "@/lib/i18n/server";
import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "Simple, transparent pricing for Anchr. Free forever or upgrade to Pro for $7/mo.",
  title: "Pricing",
};

const FAQ = [
  {
    answer:
      "yesYouCanSwitchBetweenMonthlyAndAnnualBillingAtAnyTimeIfYouSwitchFromMonthlyToAnnualYoullBeChargedTheAnnualRateAndSave$24PerYear",
    question: "canISwitchBetweenMonthlyAndAnnualBilling",
  },
  {
    answer:
      "absolutelyYouCanCancelYourProSubscriptionAtAnyTimeFromYourAccountSettingsYoullContinueToHaveAccessToProFeaturesUntilTheEndOfYourCurrentBillingPeriod",
    question: "canICancelMyProSubscriptionAtAnyTime",
  },
] as const;

const PricingPage: React.FC = async () => {
  const { t } = await initTranslations("en-US");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 px-6 py-16">
        {/* Hero */}
        <FadeIn>
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">{t("simpleTransparentPricing")}</h1>
            <p className="m-muted-70 text-lg">{t("choosePlanThatFitsYourNeeds")}</p>
          </div>
        </FadeIn>

        {/* Pricing cards */}
        <FadeIn delay={100}>
          <PricingCards />
        </FadeIn>

        {/* Waitlist CTA */}
        <FadeIn delay={200}>
          <div className="mx-auto mt-24 max-w-md text-center">
            <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">{t("readyToDropAnchor")}</h2>
            <div className="flex justify-center">
              <WaitlistForm />
            </div>
          </div>
        </FadeIn>

        {/* FAQ */}
        <FadeIn delay={300}>
          <div className="mx-auto mt-24 max-w-2xl">
            <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
              {t("frequentlyAskedQuestions")}
            </h2>
            <div className="flex flex-col gap-4">
              {FAQ.map(({ answer, question }) => (
                <details className="m-card-bg-bg m-card-border group rounded-2xl" key={question}>
                  <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5 font-medium [&::-webkit-details-marker]:hidden">
                    {t(question)}
                    <ChevronDown className="m-muted-40 size-5 shrink-0 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="px-6 pb-5">
                    <p className="m-muted-70 leading-relaxed">{t(answer)}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </FadeIn>
      </main>

      <Footer t={t} />
    </div>
  );
};

export default PricingPage;
