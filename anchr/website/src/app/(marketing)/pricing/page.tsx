import { JsonLd } from "@/components/json-ld";
import { FadeIn } from "@/components/marketing/fade-in";
import { Footer } from "@/components/marketing/footer";
import { PricingCards, type PricingViewer } from "@/components/marketing/pricing-toggle";
import { SiteHeader } from "@/components/marketing/site-header";
import { Container } from "@/components/ui/container";
import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
import { initTranslations } from "@/lib/i18n/server";
import { isProUser } from "@/lib/tier";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { ChevronDown, Download, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

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

  const { userId } = await auth();
  let viewer: PricingViewer = "anonymous";
  if (userId != null) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    viewer = user != null && isProUser(user) ? "pro" : "free";
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ answer, question }) => ({
      "@type": "Question",
      acceptedAnswer: {
        "@type": "Answer",
        text: t(answer),
      },
      name: t(question),
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={faqJsonLd} />
      <SiteHeader />

      <Container as="main" className="flex-1 py-16">
        {/* Hero */}
        <FadeIn>
          <section className="mx-auto mb-16 max-w-2xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">{t("simpleTransparentPricing")}</h1>
            <p className="m-muted-70 text-lg">{t("chooseAPlanThatFitsYourNeeds")}</p>
          </section>
        </FadeIn>

        {/* Pricing cards */}
        <FadeIn delay={100}>
          <section>
            <PricingCards viewer={viewer} />
          </section>
        </FadeIn>

        {/* Sign-up CTA */}
        <FadeIn delay={200}>
          <section className="mx-auto mt-24 max-w-md text-center">
            <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">{t("readyToSetSail")}</h2>
            <div className="flex justify-center">
              <Link
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-md px-6 text-sm font-medium transition-colors"
                href="/sign-up"
              >
                {t("getStarted")}
              </Link>
            </div>
          </section>
        </FadeIn>

        {/* Earn free Pro */}
        <FadeIn delay={300}>
          <section className="mx-auto mt-24 max-w-2xl">
            <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">{t("earnFreePro")}</h2>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="m-card-bg-bg m-card-border flex flex-1 flex-col gap-3 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <Users className="m-muted-40 size-5 shrink-0" />
                  <h3 className="font-medium">{t("referFriends")}</h3>
                </div>
                <p className="m-muted-70 text-sm leading-relaxed">
                  {t("referAFriendTheyGetAnExtraFreeMonthOfProOnTopOfTheirFirstMonthYouGetAFreeMonthWhenTheySubscribe")}
                </p>
              </div>
              <div className="m-card-bg-bg m-card-border flex flex-1 flex-col gap-3 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <Download className="m-muted-40 size-5 shrink-0" />
                  <h3 className="font-medium">{t("switchFromACompetitor")}</h3>
                </div>
                <p className="m-muted-70 text-sm leading-relaxed">
                  {t("importYourLinksFromAnotherPlatformAndGetAnExtraFreeMonthOfProOnTopOfYourFirstMonth")}
                </p>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* FAQ */}
        <FadeIn delay={400}>
          <section className="mx-auto mt-24 max-w-2xl">
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
          </section>
        </FadeIn>
      </Container>

      <Footer t={t} />
    </div>
  );
};

export default PricingPage;
