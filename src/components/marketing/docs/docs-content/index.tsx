"use client";

import Link from "next/link";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ApiKeyInput } from "../api-key-input";
import { ApiKeyProvider } from "../api-key-provider";
import { CodeBlock } from "../code-block";
import type { CodeLang } from "../constants";
import { DocsSidebar } from "../docs-sidebar";
import { EndpointSection } from "../endpoint-section";
import type { ResourceGroup } from "../types";

export type DocsContentProps = {
  authCurlExample: { code: string; html: string };
  baseUrl: string;
  highlightedExamples: Record<string, Record<CodeLang, string>>;
  resourceGroups: ResourceGroup[];
};

export const DocsContent: React.FC<DocsContentProps> = (props) => {
  const { authCurlExample, baseUrl, highlightedExamples, resourceGroups } = props;

  const { t } = useTranslation();
  const resourceTags = resourceGroups.map((g) => g.tag);

  return (
    <ApiKeyProvider>
      <div className="flex gap-10">
        {/* Sidebar */}
        <aside className="hidden w-48 shrink-0 lg:block">
          <DocsSidebar resourceTags={resourceTags} />
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-16">
          {/* Overview */}
          <section id="overview">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">{t("overview")}</h2>
            <p className="m-muted-70 text-sm leading-relaxed">
              {t("theAnchrApiIsARestfulApiThatAllowsYouToManageYourProfileLinksGroupsAndAnalyticsProgrammatically")}
            </p>
            <div className="m-card-bg-bg m-card-border mt-4 rounded-lg p-4">
              <p className="mb-1 text-xs font-semibold tracking-wider uppercase">{t("baseUrl")}</p>
              {/* eslint-disable-next-line anchr/no-raw-string-jsx -- API base URL path */}
              <code className="text-sm">{baseUrl}/api/v1</code>
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">{t("authentication")}</h2>
            <div className="m-muted-70 space-y-3 text-sm leading-relaxed">
              <p>{t("authenticateByIncludingYourApiKeyInTheAuthorizationHeaderAsABearerToken")}</p>
              <CodeBlock code={authCurlExample.code} highlightedHtml={authCurlExample.html} />
              <p>
                {t("youCanCreateAndManageApiKeysFromYour")}&nbsp;
                <Link className="text-anc-gold underline" href="/dashboard/api">
                  {t("apiDashboard")}
                </Link>
                .
              </p>
              <p>{t("ifYourKeyIsInvalidOrMissingTheApiReturnsA401UnauthorizedResponse")}</p>
            </div>
          </section>

          {/* Rate Limits */}
          <section id="rateLimits">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">{t("rateLimits")}</h2>
            <p className="m-muted-70 mb-4 text-sm leading-relaxed">
              {t("rateLimitsAreEnforcedPerApiKeyOrPerIpForUnauthenticatedRequests")}
            </p>
            <div className="m-card-bg-bg overflow-hidden rounded-lg border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase">{t("tier")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase">{t("limit")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="px-4 py-3">{t("pro")}</td>
                    {/* eslint-disable-next-line anchr/no-raw-string-jsx -- rate limit value */}
                    <td className="px-4 py-3 font-mono">1,000 / min</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="px-4 py-3">{t("free")}</td>
                    {/* eslint-disable-next-line anchr/no-raw-string-jsx -- rate limit value */}
                    <td className="px-4 py-3 font-mono">100 / min</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">{t("unauthenticated")}</td>
                    {/* eslint-disable-next-line anchr/no-raw-string-jsx -- rate limit value */}
                    <td className="px-4 py-3 font-mono">60 / min</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-2">
              <p className="m-muted-70 text-sm">{t("rateLimitHeadersAreIncludedInEveryResponse")}</p>
              <div className="m-card-bg-bg overflow-hidden rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <tbody>
                    {/* eslint-disable anchr/no-raw-string-jsx -- HTTP header names */}
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-2.5 font-mono text-xs">X-RateLimit-Limit</td>
                      <td className="m-muted-70 px-4 py-2.5 text-xs">{t("maxRequestsPerWindow")}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-2.5 font-mono text-xs">X-RateLimit-Remaining</td>
                      <td className="m-muted-70 px-4 py-2.5 text-xs">{t("remainingRequestsInCurrentWindow")}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-mono text-xs">X-RateLimit-Reset</td>
                      <td className="m-muted-70 px-4 py-2.5 text-xs">{t("secondsUntilTheWindowResets")}</td>
                    </tr>
                    {/* eslint-enable anchr/no-raw-string-jsx */}
                  </tbody>
                </table>
              </div>
              <p className="m-muted-70 text-sm">
                {t(
                  "whenYouExceedTheRateLimitYouWillReceiveA429TooManyRequestsResponseRetryAfterTheNumberOfSecondsIndicatedInTheXRatelimitResetHeader",
                )}
              </p>
            </div>
          </section>

          {/* API Key Input */}
          <section>
            <h3 className="mb-3 text-lg font-bold">{t("yourApiKey")}</h3>
            <p className="m-muted-50 mb-3 text-xs">
              {t("pasteYourApiKeyToTryAuthenticatedEndpointsKeyIsStoredInMemoryOnly")}
            </p>
            <ApiKeyInput />
          </section>

          {/* API Reference — Resource Groups */}
          {resourceGroups.map((group) => {
            return (
              <section id={`resource-${group.tag.toLowerCase()}`} key={group.tag}>
                <h2 className="mb-4 text-3xl font-bold tracking-tight">{group.tag}</h2>
                <div className="m-card-bg-bg overflow-hidden rounded-xl border border-white/10">
                  {group.endpoints.map((endpoint) => {
                    return (
                      <EndpointSection
                        baseUrl={baseUrl}
                        endpoint={endpoint}
                        highlightedExamples={
                          highlightedExamples[endpoint.operationId] ?? {
                            curl: "",
                            javascript: "",
                            python: "",
                          }
                        }
                        key={endpoint.operationId}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </ApiKeyProvider>
  );
};
