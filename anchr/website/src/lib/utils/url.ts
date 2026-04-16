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

/** Hostnames that refer back to the app itself — blocked to prevent redirect
 *  loops when a user configures a bio/short link pointing at anchr.to or the
 *  configured short domain. The short-domain match is env-aware so this works
 *  in CI (anch.to) and any production override identically. */
function isAppSelfHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "anchr.to" || h === "www.anchr.to") {
    return true;
  }
  const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN?.toLowerCase();
  if (shortDomain != null && shortDomain.length > 0) {
    if (h === shortDomain || h === `www.${shortDomain}`) {
      return true;
    }
  }
  return false;
}

/**
 * Hostnames that resolve to private or link-local address space. Blocking
 * these at URL-parse time prevents SSRF via server-side URL probes
 * (see urlResolves, which HEADs the user-supplied destination).
 *
 * Covers:
 *   - localhost and all bare .localhost / .local / .internal / .lan suffixes
 *   - IPv4 loopback (127.0.0.0/8), RFC1918 private (10/8, 172.16/12, 192.168/16),
 *     link-local (169.254/16 — includes AWS/GCP/Azure metadata), CGNAT (100.64/10),
 *     and 0.0.0.0/8
 *   - IPv6 loopback (::1), unique-local (fc00::/7), link-local (fe80::/10),
 *     IPv4-mapped private ranges
 *   - Raw IP literals surrounded by [] (IPv6 form)
 */
const PRIVATE_HOSTNAME = /^(localhost|.+\.(localhost|local|internal|lan))$/i;

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) {
    return false;
  }
  const octets = parts.map((p) => Number(p));
  if (octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) {
    return false;
  }
  const [a, b] = octets;
  if (a === 0 || a === 10 || a === 127) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  if (a === 100 && b >= 64 && b <= 127) {
    return true;
  }
  return false;
}

function isPrivateIpv6(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "::" || h === "::1") {
    return true;
  }
  if (h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) {
    return true;
  }
  // IPv4-mapped (::ffff:...) — WHATWG URL normalizes dotted v4 suffixes into
  // hex, so we can't just pattern-match the dotted form. Treat any ::ffff:
  // address as private — they're not used for legitimate public destinations.
  if (h.startsWith("::ffff:")) {
    return true;
  }
  return false;
}

export function isSafeUrl(url: string, options?: { allowInternalHosts?: boolean }): boolean {
  if (BLOCKED_PROTOCOLS.test(url.trim())) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(ensureProtocol(url));
  } catch {
    return false;
  }

  // Allowlist scheme — http(s) only. Rejects file://, ftp://, gopher://, etc.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  if (!options?.allowInternalHosts && isAppSelfHost(parsed.hostname)) {
    return false;
  }

  // Private-host check is gated on allowInternalHosts — admins creating links
  // to internal tooling need the escape hatch, but regular users do not.
  if (!options?.allowInternalHosts) {
    // WHATWG-compliant URL parsers keep the surrounding brackets on IPv6
    // hostnames ([::1]); strip them before pattern-matching.
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (PRIVATE_HOSTNAME.test(host)) {
      return false;
    }
    if (isPrivateIpv4(host) || isPrivateIpv6(host)) {
      return false;
    }
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
