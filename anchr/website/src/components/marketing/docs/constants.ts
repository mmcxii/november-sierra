import { getKeyPrefix, getKeySuffix } from "@/lib/api-keys";

export const API_KEY_PREFIX = "anc_k_";

export const METHOD_COLORS: Record<string, string> = {
  DELETE: "bg-red-500/15 text-red-400",
  GET: "bg-emerald-500/15 text-emerald-400",
  PATCH: "bg-amber-500/15 text-amber-400",
  POST: "bg-blue-500/15 text-blue-400",
};

export const STATIC_SECTIONS = ["overview", "authentication", "rateLimits"] as const;

export const CODE_LANGS = ["curl", "javascript", "python"] as const;
export type CodeLang = (typeof CODE_LANGS)[number];

const PARAM_PLACEHOLDERS: Record<string, string> = {
  end: "2024-12-31",
  id: "abc123",
  start: "2024-01-01",
  username: "alice",
};

export function getParamPlaceholder(name: string): string {
  return PARAM_PLACEHOLDERS[name] ?? name;
}

const MIN_KEY_LENGTH = 10;

export function maskApiKey(key: string): null | string {
  if (key.startsWith(API_KEY_PREFIX) && key.length > MIN_KEY_LENGTH) {
    return `${getKeyPrefix(key)}••••${getKeySuffix(key)}`;
  }
  return null;
}
