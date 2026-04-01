"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";

export const TryApi: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = React.useState("a");
  const [result, setResult] = React.useState<null | string>(null);
  const [error, setError] = React.useState<null | string>(null);
  const [loading, setLoading] = React.useState(false);

  const handleFetch = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/v1/users/${encodeURIComponent(username.trim())}`);
      const json = await response.json();

      if (!response.ok) {
        setError(t("noProfileFoundFor{{username}}", { username: username.trim() }));
        return;
      }

      setResult(JSON.stringify(json.data, null, 2));
    } catch {
      setError(t("somethingWentWrongPleaseTryAgain"));
    } finally {
      setLoading(false);
    }
  }, [t, username]);

  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void handleFetch();
    },
    [handleFetch],
  );

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  }, []);

  return (
    <div>
      <form className="flex gap-3" onSubmit={handleSubmit}>
        <input
          className="m-card-bg-bg m-card-border flex-1 rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-white/20"
          onChange={handleInputChange}
          placeholder={t("enterAUsername")}
          type="text"
          value={username}
        />
        <button
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          disabled={loading || username.trim().length === 0}
          type="submit"
        >
          {loading ? t("loading") : t("fetchProfile")}
        </button>
      </form>

      {error != null && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result != null && (
        <pre
          className="mt-4 max-h-96 overflow-auto rounded-lg bg-[#0d1117] p-4 text-sm leading-relaxed text-[#e6edf3]"
          data-testid="try-api-response"
        >
          <code>{result}</code>
        </pre>
      )}
    </div>
  );
};
