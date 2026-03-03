import { Footer } from "@/components/marketing/footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { initTranslations } from "@/lib/i18n/server";

const sections = [
  {
    body: "We collect your email address when you join our waitlist. We use it to let you know when Anchr is ready. That's it. We don't sell your data. We don't spam you. We don't share your information with anyone except the services that help us operate.",
    heading: "The short version",
  },
  {
    body: "When you join the waitlist, we collect your email address. That's the only personal information we ask for at this stage. We may also collect basic technical data automatically — things like your browser type and general location — through standard web infrastructure. This data is never tied to your identity.",
    heading: "What we collect",
  },
  {
    body: "Your email address is used for one purpose: to notify you when Anchr launches and to share meaningful updates about the product. We will never send unsolicited marketing, sell newsletter slots, or use your address for anything you didn't sign up for. You can unsubscribe from any email we send, and we'll remove you promptly.",
    heading: "How we use it",
  },
  {
    body: "We use Clerk to manage our waitlist. Your email is processed by Clerk on our behalf under their privacy and security standards. Beyond that, we do not sell, rent, trade, or otherwise share your personal information with third parties. Full stop.",
    heading: "Who we share it with",
  },
  {
    body: "We retain your email address until Anchr launches or until you ask us to remove you — whichever comes first. After launch, if you choose not to create an account, your waitlist record will be deleted.",
    heading: "How long we keep it",
  },
  {
    body: "You have the right to access, correct, or delete the information we hold about you. If you'd like to be removed from the waitlist or have any questions about your data, just reach out and we'll take care of it without fuss.",
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

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <p className="mb-3 text-xs font-medium tracking-[0.2em] text-[#92b0be]/50 uppercase">
            Last updated February 22, 2026
          </p>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white">Privacy Policy</h1>
          <p className="text-lg leading-relaxed text-[#92b0be]/70">
            We built Anchr to help people own their presence online. That extends to how we handle your data — with
            care, honesty, and respect.
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-12">
          {sections.map((section) => (
            <div key={section.heading}>
              <h2 className="mb-3 text-lg font-semibold text-[#d4b896]">{section.heading}</h2>
              <p className="leading-relaxed text-[#92b0be]/70">{section.body}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
};

export default PrivacyPage;
