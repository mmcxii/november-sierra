const VALID_DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const BLOCKED_DOMAIN_REGEX = /(?:^|\.)anchr\.to$/i;

export function isValidDomain(domain: string): boolean {
  const normalized = domain.trim().toLowerCase();
  if (!VALID_DOMAIN_REGEX.test(normalized)) {
    return false;
  }
  if (BLOCKED_DOMAIN_REGEX.test(normalized)) {
    return false;
  }
  return true;
}

export function ensureProtocol(url: string): string {
  const trimmed = url.trim();
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export const BLOCKED_PROTOCOLS = /^(javascript|data|vbscript):/i;
const INTERNAL_HOSTS = /^(www\.)?anchr\.to$/i;

export function isSafeUrl(url: string, options?: { allowInternalHosts?: boolean }): boolean {
  if (BLOCKED_PROTOCOLS.test(url.trim())) {
    return false;
  }

  try {
    const parsed = new URL(ensureProtocol(url));

    if (!options?.allowInternalHosts && INTERNAL_HOSTS.test(parsed.hostname)) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Extracts a slug from a URL based on the domain, optionally including path segments.
 * - Strips www. prefix
 * - Strips TLD (.com, .io, .co.uk, etc.)
 * - When `includePath` is true, appends sanitized path segments
 * - Lowercases and replaces invalid chars with hyphens
 */
export function generateSlug(url: string, includePath = false): string {
  try {
    const parsed = new URL(ensureProtocol(url));
    let hostname = parsed.hostname.toLowerCase();

    // Strip www. prefix
    hostname = hostname.replace(/^www\./, "");

    // Split into parts
    const parts = hostname.split(".");

    let domainSlug: string;

    // For single-part hostnames (e.g. localhost), use as-is
    if (parts.length <= 1) {
      domainSlug = parts[0] ?? hostname;
    }
    // For two-letter second-level TLDs (co.uk, com.au, etc.), take everything before them
    else {
      const secondLevel = parts[parts.length - 2];
      if (parts.length >= 3 && secondLevel != null && secondLevel.length <= 2) {
        domainSlug = parts.slice(0, -2).join("-");
      } else {
        domainSlug = parts.slice(0, -1).join("-");
      }
    }

    if (!includePath) {
      return sanitizeSlug(domainSlug);
    }

    // Append path segments
    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    if (pathSegments.length === 0) {
      return sanitizeSlug(domainSlug);
    }

    return sanitizeSlug(`${domainSlug}-${pathSegments.join("-")}`);
  } catch {
    // Fallback: sanitize the raw input
    return sanitizeSlug(url);
  }
}

function sanitizeSlug(value: string): string {
  return (
    value
      .toLowerCase()
      // Replace anything that isn't a-z, 0-9, or hyphen
      .replace(/[^a-z0-9-]/g, "-")
      // Collapse consecutive hyphens
      .replace(/-+/g, "-")
      // Trim leading/trailing hyphens
      .replace(/^-|-$/g, "") || "link"
  );
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
