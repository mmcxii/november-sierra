import { CodeTabs } from "@/components/marketing/code-tabs";
import { CODE_SOURCES, LANG_MAP, TABS, type TabId } from "@/components/marketing/code-tabs/constants";
import { FadeIn } from "@/components/marketing/fade-in";
import { Footer } from "@/components/marketing/footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { TryApi } from "@/components/marketing/try-api";
import { Container } from "@/components/ui/container";
import { initTranslations } from "@/lib/i18n/server";
import { highlight } from "@/lib/shiki";
import { Check, Minus, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CAPABILITIES, COMPARISON_ROWS } from "./constants";

export const metadata: Metadata = {
  description:
    "Anchr is the link-in-bio platform built for AI agents. Public REST API, JSON-LD structured data, MCP server, and discovery files.",
  openGraph: {
    description:
      "Public REST API, JSON-LD structured data, MCP server, and discovery files. The link-in-bio your AI assistant can manage.",
    title: "Anchr for Developers",
    type: "website",
  },
  title: "Developers",
  twitter: {
    card: "summary_large_image",
    description:
      "Public REST API, JSON-LD structured data, MCP server, and discovery files. The link-in-bio your AI assistant can manage.",
    title: "Anchr for Developers",
  },
};

const DevelopersPage: React.FC = async () => {
  const { t } = await initTranslations("en-US");

  // Highlight code examples at the server level
  const highlightedHtml = {} as Record<TabId, string>;
  for (const tab of TABS) {
    highlightedHtml[tab] = await highlight(CODE_SOURCES[tab], LANG_MAP[tab] as Parameters<typeof highlight>[1]);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <Container as="main" className="max-w-4xl flex-1 py-16 xl:max-w-4xl">
        {/* 1. Hero */}
        <FadeIn>
          <div className="mx-auto mb-24 max-w-2xl text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">{t("builtForTheAiAgentEra")}</h2>
            <p className="m-muted-70 text-lg">{t("theLinkInBioYourAiAssistantCanManage")}</p>
          </div>
        </FadeIn>

        {/* 2. Key Capabilities */}
        <FadeIn delay={100}>
          <section className="mb-24">
            <h3 className="mb-8 text-2xl font-bold tracking-tight">{t("keyCapabilities")}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {CAPABILITIES.map((key) => (
                <div className="m-card-bg-bg m-card-border flex items-start gap-3 rounded-xl p-5" key={key}>
                  <Check className="text-anc-gold mt-0.5 size-5 shrink-0" strokeWidth={2} />
                  <span className="text-sm font-medium">{t(key)}</span>
                </div>
              ))}
            </div>
            <div className="m-card-bg-bg m-card-border mt-4 rounded-xl p-5">
              <p className="m-muted-50 mb-2 text-xs font-medium tracking-wider uppercase">{t("agentDiscoveryFlow")}</p>
              <p className="font-mono text-sm">{t("anchrJsonOpenapiApi")}</p>
            </div>
          </section>
        </FadeIn>

        {/* 3. Code Examples */}
        <FadeIn delay={200}>
          <section className="mb-24">
            <h3 className="mb-8 text-2xl font-bold tracking-tight">{t("codeExamples")}</h3>
            <CodeTabs highlightedHtml={highlightedHtml} />
          </section>
        </FadeIn>

        {/* 4. MCP Demo */}
        <FadeIn delay={300}>
          <section className="mb-24">
            <h3 className="mb-8 text-2xl font-bold tracking-tight">{t("seeItInAction")}</h3>
            <div className="m-card-bg-bg m-card-border overflow-hidden rounded-xl">
              <div className="border-b border-white/10 px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-red-500/60" />
                  <div className="size-3 rounded-full bg-yellow-500/60" />
                  <div className="size-3 rounded-full bg-green-500/60" />
                  <span className="m-muted-40 ml-3 text-xs font-medium">{t("aiAssistant")}</span>
                </div>
              </div>
              <div className="flex flex-col gap-4 p-5">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-xs rounded-2xl rounded-br-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
                    {t("addMyNewBlogPostToMyAnchrPage")}
                  </div>
                </div>
                {/* Assistant response */}
                <div className="flex justify-start">
                  <div className="m-card-border max-w-sm rounded-2xl rounded-bl-sm border px-4 py-2.5 text-sm">
                    {t("addedIveAddedYourNewBlogPostLinkToYourAnchrPageItsNowVisibleToYourVisitors")}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* 5. Comparison */}
        <FadeIn delay={400}>
          <section className="mb-24">
            <h3 className="mb-8 text-2xl font-bold tracking-tight">{t("otherLinkInBioToolsWerentBuiltForTheAiEra")}</h3>
            <div className="m-card-bg-bg m-card-border overflow-hidden rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-5 py-3 text-left font-medium">{t("feature")}</th>
                    <th className="px-5 py-3 text-center font-medium">{t("anchr")}</th>
                    <th className="m-muted-50 px-5 py-3 text-center font-medium">{t("other")}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr className="border-b border-white/5 last:border-b-0" key={row.feature}>
                      <td className="px-5 py-3">{t(row.feature)}</td>
                      <td className="px-5 py-3 text-center">
                        <Check className="text-anc-gold mx-auto size-4" strokeWidth={2} />
                      </td>
                      <td className="px-5 py-3 text-center">
                        {row.other === "some" ? (
                          <Minus className="m-muted-40 mx-auto size-4" strokeWidth={2} />
                        ) : (
                          <X className="m-muted-40 mx-auto size-4" strokeWidth={2} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </FadeIn>

        {/* 6. Interactive Try It */}
        <FadeIn delay={500}>
          <section className="mb-24">
            <h3 className="mb-4 text-2xl font-bold tracking-tight">{t("tryTheLiveApi")}</h3>
            <p className="m-muted-70 mb-8 text-sm">{t("theLinkInBioYourAiAssistantCanManage")}</p>
            <TryApi />
          </section>
        </FadeIn>

        {/* 7. CTA */}
        <FadeIn delay={600}>
          <section className="mb-16 text-center">
            <h3 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">{t("getYourApiKey")}</h3>
            <Link
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-md px-6 text-sm font-medium transition-colors"
              href="/sign-up"
            >
              {t("getStarted")}
            </Link>
          </section>
        </FadeIn>
      </Container>

      <Footer t={t} />
    </div>
  );
};

export default DevelopersPage;
