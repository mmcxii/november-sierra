import { DocsContent } from "@/components/marketing/docs/docs-content";
import { parseOpenApiSpec } from "@/components/marketing/docs/parse-spec";
import { Footer } from "@/components/marketing/footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Container } from "@/components/ui/container";
import { generateOpenApiSpec } from "@/lib/api/openapi";
import { initTranslations } from "@/lib/i18n/server";
import { highlight } from "@/lib/shiki";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description:
    "Interactive API documentation for the Anchr REST API. Explore endpoints, try requests, and integrate with your applications.",
  openGraph: {
    description:
      "Interactive API documentation for the Anchr REST API. Explore endpoints, try requests, and integrate with your applications.",
    title: "Anchr API Docs",
    type: "website",
  },
  title: "API Docs",
  twitter: {
    card: "summary_large_image",
    description:
      "Interactive API documentation for the Anchr REST API. Explore endpoints, try requests, and integrate with your applications.",
    title: "Anchr API Docs",
  },
};

const DocsPage: React.FC = async () => {
  const { t } = await initTranslations("en-US");
  const { envSchema } = await import("@/lib/env");
  const baseUrl = envSchema.NEXT_PUBLIC_APP_URL;

  // Generate and parse OpenAPI spec
  const spec = generateOpenApiSpec(baseUrl);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- OpenAPI lib types don't align with our parser's simplified shape
  const resourceGroups = parseOpenApiSpec(spec as any);

  // Highlight all code examples at build time (server-only)
  const highlightedExamples: Record<string, Record<"curl" | "javascript" | "python", string>> = {};

  for (const group of resourceGroups) {
    for (const endpoint of group.endpoints) {
      const [curlHtml, jsHtml, pyHtml] = await Promise.all([
        highlight(endpoint.codeExamples.curl, "bash"),
        highlight(endpoint.codeExamples.javascript, "javascript"),
        highlight(endpoint.codeExamples.python, "python"),
      ]);
      highlightedExamples[endpoint.operationId] = {
        curl: curlHtml,
        javascript: jsHtml,
        python: pyHtml,
      };
    }
  }

  // Auth example for the Authentication section
  const authCurlCode = `curl "${baseUrl}/api/v1/me" \\\n  -H "Authorization: Bearer anc_k_YOUR_KEY"`;
  const authCurlHtml = await highlight(authCurlCode, "bash");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <Container as="main" className="max-w-6xl flex-1 py-16">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">{t("apiDocumentation")}</h1>
          <p className="m-muted-70 text-lg">{t("everythingYouNeedToIntegrateWithTheAnchrApi")}</p>
        </div>

        <DocsContent
          authCurlExample={{ code: authCurlCode, html: authCurlHtml }}
          baseUrl={baseUrl}
          highlightedExamples={highlightedExamples}
          resourceGroups={resourceGroups}
        />
      </Container>

      <Footer t={t} />
    </div>
  );
};

export default DocsPage;
