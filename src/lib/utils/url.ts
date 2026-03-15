export function ensureProtocol(url: string): string {
  const trimmed = url.trim();
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

const BLOCKED_PROTOCOLS = /^(javascript|data|vbscript):/i;
const INTERNAL_HOSTS = /^(www\.)?anchr\.to$/i;

export function isSafeUrl(url: string): boolean {
  if (BLOCKED_PROTOCOLS.test(url.trim())) {
    return false;
  }

  try {
    const parsed = new URL(ensureProtocol(url));

    if (INTERNAL_HOSTS.test(parsed.hostname)) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

export async function urlResolves(url: string, timeoutMs = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(ensureProtocol(url), {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}
