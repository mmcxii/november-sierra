"use client";

import { useApiKey } from "@/components/marketing/docs/api-key-provider";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { getParamPlaceholder } from "../constants";
import type { EndpointParam, HttpMethod } from "../types";

export type TryItProps = {
  baseUrl: string;
  method: HttpMethod;
  params: EndpointParam[];
  path: string;
  requiresAuth: boolean;
};

export const TryIt: React.FC<TryItProps> = (props) => {
  const { baseUrl, method, params, path, requiresAuth } = props;

  const { t } = useTranslation();
  const { apiKey } = useApiKey();
  const [pathParams, setPathParams] = React.useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<null | string>(null);
  const [error, setError] = React.useState<null | string>(null);
  const [loading, setLoading] = React.useState(false);

  const pathParamDefs = params.filter((p) => p.in === "path");
  const queryParamDefs = params.filter((p) => p.in === "query");

  const canExecute = (!requiresAuth || Boolean(apiKey)) && pathParamDefs.every((p) => pathParams[p.name]?.trim());

  const handleExecute = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let url = `${baseUrl}${path}`;
      for (const p of params) {
        if (p.in === "path") {
          url = url.replace(`{${p.name}}`, encodeURIComponent(pathParams[p.name]?.trim() ?? ""));
        }
      }

      const searchParams = new URLSearchParams();
      for (const p of params) {
        if (p.in !== "query") {
          continue;
        }
        const val = queryParams[p.name]?.trim();
        if (val) {
          searchParams.set(p.name, val);
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        url += `?${qs}`;
      }

      const headers: Record<string, string> = {};
      if (requiresAuth && apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const response = await fetch(url, { headers, method: method.toUpperCase() });
      const json = await response.json();

      if (!response.ok) {
        setError(JSON.stringify(json, null, 2));
        return;
      }

      setResult(JSON.stringify(json, null, 2));
    } catch {
      setError(t("somethingWentWrongPleaseTryAgain"));
    } finally {
      setLoading(false);
    }
  }, [baseUrl, path, params, pathParams, queryParams, requiresAuth, apiKey, method, t]);

  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void handleExecute();
    },
    [handleExecute],
  );

  const handlePathParamChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.dataset.param ?? "";
    setPathParams((prev) => {
      return { ...prev, [name]: e.target.value };
    });
  }, []);

  const handleQueryParamChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.dataset.param ?? "";
    setQueryParams((prev) => {
      return { ...prev, [name]: e.target.value };
    });
  }, []);

  return (
    <div className="mt-4 space-y-3" data-testid="try-it">
      <form className="space-y-3" onSubmit={handleSubmit}>
        {pathParamDefs.map((p) => {
          return (
            <div className="flex items-center gap-2" key={p.name}>
              <label className="w-24 text-xs font-medium" htmlFor={`param-${p.name}`}>
                {`{${p.name}}`}
              </label>
              <input
                className="m-card-bg-bg m-card-border flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                data-param={p.name}
                id={`param-${p.name}`}
                onChange={handlePathParamChange}
                placeholder={getParamPlaceholder(p.name)}
                type="text"
                value={pathParams[p.name] ?? ""}
              />
            </div>
          );
        })}

        {queryParamDefs.map((p) => {
          return (
            <div className="flex items-center gap-2" key={p.name}>
              <label className="w-24 text-xs font-medium" htmlFor={`query-${p.name}`}>
                {p.name}
              </label>
              <input
                className="m-card-bg-bg m-card-border flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                data-param={p.name}
                id={`query-${p.name}`}
                onChange={handleQueryParamChange}
                placeholder={getParamPlaceholder(p.name)}
                type="text"
                value={queryParams[p.name] ?? ""}
              />
            </div>
          );
        })}

        {requiresAuth && !apiKey && (
          <p className="text-xs text-amber-400">{t("pasteYourApiKeyAboveToTryThisEndpoint")}</p>
        )}

        <button
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          disabled={!canExecute || loading}
          type="submit"
        >
          {loading ? t("loading") : t("send")}
        </button>
      </form>

      {error != null && (
        <pre
          className="max-h-64 overflow-auto rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm leading-relaxed text-red-400"
          data-testid="try-it-error"
        >
          <code>{error}</code>
        </pre>
      )}

      {result != null && (
        <pre
          className="max-h-96 overflow-auto rounded-lg bg-[#0d1117] p-4 text-sm leading-relaxed text-[#e6edf3]"
          data-testid="try-it-response"
        >
          <code>{result}</code>
        </pre>
      )}
    </div>
  );
};
