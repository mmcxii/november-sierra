import { Footer } from "@/components/marketing/footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Container } from "@/components/ui/container";
import { initTranslations } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "Learn how Anchr handles your data — with care, honesty, and respect. We don't sell your data or spam you.",
  title: "Privacy Policy",
};

const sections = [
  {
    body: "We collect your name, email address, and profile information when you create an account. We use it to provide and improve the Anchr service. We don't sell your data. We don't spam you. We don't share your information with anyone except the services that help us operate.",
    heading: "The short version",
  },
  {
    body: "When you create an account, we collect your email address, display name, and username. You may also upload a profile photo. We may collect basic technical data automatically — things like your browser type and general location — through standard web infrastructure. This data is never tied to your identity.",
    heading: "What we collect",
  },
  {
    body: "Your information is used to provide the Anchr service — your link page, analytics, and account features. We may also send you important product updates. We will never send unsolicited marketing, sell newsletter slots, or use your information for anything you didn't sign up for. You can unsubscribe from any email we send, and we'll honor that promptly.",
    heading: "How we use it",
  },
  {
    body: "We use Clerk to manage authentication and accounts. Your data is processed by Clerk on our behalf under their privacy and security standards. Beyond that, we do not sell, rent, trade, or otherwise share your personal information with third parties. Full stop.",
    heading: "Who we share it with",
  },
  {
    body: "We retain your information for as long as your account is active. If you delete your account, your data will be removed promptly.",
    heading: "How long we keep it",
  },
  {
    body: "You have the right to access, correct, or delete the information we hold about you. If you'd like to delete your account or have any questions about your data, just reach out and we'll take care of it without fuss.",
    heading: "Your rights",
  },
  {
    body: "Questions, concerns, or requests? Email us at privacy@anchr.to and we'll get back to you.",
    heading: "Contact",
  },
];

const PrivacyPage: React.FC = async () => {
  const { t } = await initTranslations("en-US");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <Container as="main" className="max-w-2xl flex-1 py-16 xl:max-w-2xl">
        {/* Header */}
        <div className="mb-16">
          {/* eslint-disable-next-line anchr/no-raw-string-jsx -- legal page, static content */}
          <p className="tracking-anc-caps text-anc-steel/50 mb-3 text-xs font-medium uppercase">
            Last updated March 22, 2026
          </p>
          {/* eslint-disable-next-line anchr/no-raw-string-jsx -- legal page, static content */}
          <h1 className="text-anc-cream mb-6 text-4xl font-bold tracking-tight">Privacy Policy</h1>
          {/* eslint-disable-next-line anchr/no-raw-string-jsx -- legal page, static content */}
          <p className="text-anc-steel/70 text-lg leading-relaxed">
            We built Anchr to help people own their presence online. That extends to how we handle your data — with
            care, honesty, and respect.
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-12">
          {sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-anc-gold mb-3 text-lg font-semibold">{section.heading}</h2>
              <p className="text-anc-steel/70 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </Container>

      <Footer t={t} />
    </div>
  );
};

export default PrivacyPage;
