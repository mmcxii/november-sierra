"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { CodeExamples } from "../code-examples";
import { METHOD_COLORS, type CodeLang } from "../constants";
import { TryIt } from "../try-it";
import type { ParsedEndpoint } from "../types";

export type EndpointSectionProps = {
  baseUrl: string;
  endpoint: ParsedEndpoint;
  highlightedExamples: Record<CodeLang, string>;
};

export const EndpointSection: React.FC<EndpointSectionProps> = (props) => {
  const { baseUrl, endpoint, highlightedExamples } = props;

  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const methodUpper = endpoint.method.toUpperCase();
  const showTryIt = endpoint.method === "get";

  const bodyRequired = endpoint.body?.required ?? [];

  const examples: Record<CodeLang, { code: string; html: string }> = {
    curl: { code: endpoint.codeExamples.curl, html: highlightedExamples.curl },
    javascript: { code: endpoint.codeExamples.javascript, html: highlightedExamples.javascript },
    python: { code: endpoint.codeExamples.python, html: highlightedExamples.python },
  };

  const handleToggle = React.useCallback(() => {
    setIsOpen((prev) => {
      return !prev;
    });
  }, []);

  return (
    <div className="m-card-border border-b last:border-b-0" data-testid={`endpoint-${endpoint.operationId}`}>
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/5"
        data-testid={`endpoint-toggle-${endpoint.operationId}`}
        onClick={handleToggle}
        type="button"
      >
        <ChevronRight className={cn("size-4 shrink-0 transition-transform", { "rotate-90": isOpen })} strokeWidth={2} />
        <span className={cn("rounded px-2 py-0.5 text-xs font-bold uppercase", METHOD_COLORS[methodUpper])}>
          {methodUpper}
        </span>
        <code className="text-sm font-medium">{endpoint.path}</code>
        <span className="m-muted-50 ml-auto hidden text-xs sm:inline">{endpoint.summary}</span>
      </button>

      {isOpen && (
        <div className="space-y-6 px-5 pb-6">
          <p className="m-muted-70 text-sm">{endpoint.summary}</p>

          {endpoint.requiresAuth && (
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                {t("requiresAuthentication")}
              </span>
              {endpoint.summary.includes("Pro") && (
                <span className="rounded bg-purple-500/15 px-2 py-0.5 text-xs font-medium text-purple-400">
                  {t("pro")}
                </span>
              )}
            </div>
          )}

          {endpoint.params.length > 0 && (
            <div>
              <h5 className="mb-2 text-xs font-semibold tracking-wider uppercase">{t("parameters")}</h5>
              <div className="m-card-bg-bg overflow-hidden rounded-lg border border-white/10">
                {endpoint.params.map((param) => {
                  return (
                    <div
                      className="flex items-center gap-4 border-b border-white/5 px-4 py-2.5 last:border-b-0"
                      key={param.name}
                    >
                      <code className="text-xs font-medium">{param.name}</code>
                      <span className="m-muted-40 text-xs">{param.type}</span>
                      <span className="m-muted-40 text-xs">{param.in}</span>
                      {param.required && <span className="text-xs font-medium text-red-400">{t("required")}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {endpoint.body != null && (
            <div>
              <h5 className="mb-2 text-xs font-semibold tracking-wider uppercase">{t("requestBody")}</h5>
              <div className="m-card-bg-bg overflow-hidden rounded-lg border border-white/10">
                {Object.entries(endpoint.body.properties).map(([key, val]) => {
                  const typeDisplay = val.nullable ? `${val.type} | null` : val.type;
                  return (
                    <div
                      className="flex items-center gap-4 border-b border-white/5 px-4 py-2.5 last:border-b-0"
                      key={key}
                    >
                      <code className="text-xs font-medium">{key}</code>
                      <span className="m-muted-40 text-xs">{typeDisplay}</span>
                      {bodyRequired.includes(key) ? (
                        <span className="text-xs font-medium text-red-400">{t("required")}</span>
                      ) : (
                        <span className="m-muted-40 text-xs">{t("optional")}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h5 className="mb-2 text-xs font-semibold tracking-wider uppercase">{t("responses")}</h5>
            <div className="m-card-bg-bg overflow-hidden rounded-lg border border-white/10">
              {endpoint.responses.map((res) => {
                return (
                  <div
                    className="flex items-center gap-4 border-b border-white/5 px-4 py-2.5 last:border-b-0"
                    key={res.statusCode}
                  >
                    <code
                      className={cn("text-xs font-bold", {
                        "text-amber-400": res.statusCode.startsWith("4"),
                        "text-emerald-400": res.statusCode.startsWith("2"),
                        "text-red-400": res.statusCode.startsWith("5"),
                      })}
                    >
                      {res.statusCode}
                    </code>
                    <span className="m-muted-70 text-xs">{res.description}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h5 className="mb-2 text-xs font-semibold tracking-wider uppercase">{t("codeExamples")}</h5>
            <CodeExamples examples={examples} />
          </div>

          {showTryIt && (
            <div>
              <h5 className="mb-2 text-xs font-semibold tracking-wider uppercase">{t("tryIt")}</h5>
              <TryIt
                baseUrl={baseUrl}
                method={endpoint.method}
                params={endpoint.params}
                path={endpoint.path}
                requiresAuth={endpoint.requiresAuth}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
