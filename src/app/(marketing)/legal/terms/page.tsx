import { Footer } from "@/components/marketing/footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Container } from "@/components/ui/container";
import { initTranslations } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "Terms of Service for Anchr — the link-in-bio tool that helps you own your online presence.",
  title: "Terms of Service",
};

const sections = [
  {
    body: 'By accessing or using Anchr ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. We may update these terms from time to time, and your continued use of the Service after changes are posted constitutes acceptance of those changes.',
    heading: "Acceptance of terms",
  },
  {
    body: "You must be at least 13 years old to use the Service. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You agree to provide accurate, current, and complete information during registration and to keep your account information up to date.",
    heading: "Account terms",
  },
  {
    body: "You agree not to use the Service to: violate any applicable law or regulation; infringe on the intellectual property rights of others; distribute malware, spam, or other harmful content; impersonate any person or entity; interfere with or disrupt the Service or its infrastructure; or engage in any activity that is abusive, harassing, or otherwise objectionable. We reserve the right to suspend or terminate accounts that violate these terms.",
    heading: "Acceptable use",
  },
  {
    body: "You retain ownership of all content you create or upload to the Service. By using the Service, you grant Anchr a limited, non-exclusive license to host, display, and distribute your content solely for the purpose of operating and providing the Service. Anchr and its logos, designs, and branding are the property of November Sierra LLC. You may not use our trademarks without prior written permission.",
    heading: "Intellectual property",
  },
  {
    body: "Either party may terminate this agreement at any time. You may delete your account at any time through the Service. We may suspend or terminate your access if you violate these terms or if we discontinue the Service. Upon termination, your right to use the Service ceases immediately. We may retain certain data as required by law or for legitimate business purposes.",
    heading: "Termination",
  },
  {
    body: 'The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, secure, or error-free.',
    heading: "Disclaimers",
  },
  {
    body: "To the fullest extent permitted by law, Anchr and its affiliates, officers, and employees shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenue, whether incurred directly or indirectly, or any loss of data, use, or goodwill, arising from your use of the Service.",
    heading: "Limitation of liability",
  },
  {
    body: "We reserve the right to modify these terms at any time. When we make changes, we will update the date at the top of this page. Material changes will be communicated through the Service or via email. Your continued use of the Service after changes take effect constitutes acceptance of the revised terms.",
    heading: "Changes to terms",
  },
  {
    body: "Questions about these terms? Email us at legal@anchr.to and we'll get back to you.",
    heading: "Contact",
  },
];

const TermsPage: React.FC = async () => {
  const { t } = await initTranslations("en-US");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <Container as="main" className="max-w-2xl flex-1 py-16 xl:max-w-2xl">
        {/* Header */}
        <div className="mb-16">
          {/* eslint-disable-next-line anchr/no-raw-string-jsx -- legal page, static content */}
          <p className="tracking-anc-caps text-anc-steel/50 mb-3 text-xs font-medium uppercase">
            Last updated March 3, 2026
          </p>
          {/* eslint-disable-next-line anchr/no-raw-string-jsx -- legal page, static content */}
          <h1 className="text-anc-cream mb-6 text-4xl font-bold tracking-tight">Terms of Service</h1>
          {/* eslint-disable-next-line anchr/no-raw-string-jsx -- legal page, static content */}
          <p className="text-anc-steel/70 text-lg leading-relaxed">
            These terms govern your use of Anchr. By using our Service, you agree to these terms — please read them
            carefully.
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

export default TermsPage;
