import { describe, expect, it, vi } from "vitest";
import { ensureProtocol, generateSlug, isSafeUrl, urlResolves } from "./url";

describe("ensureProtocol", () => {
  it("prepends https:// when no protocol is present", () => {
    //* Arrange
    const url = "example.com";

    //* Act
    const result = ensureProtocol(url);

    //* Assert
    expect(result).toBe("https://example.com");
  });

  it("preserves https://", () => {
    //* Arrange
    const url = "https://example.com";

    //* Act
    const result = ensureProtocol(url);

    //* Assert
    expect(result).toBe("https://example.com");
  });

  it("preserves http://", () => {
    //* Arrange
    const url = "http://example.com";

    //* Act
    const result = ensureProtocol(url);

    //* Assert
    expect(result).toBe("http://example.com");
  });

  it("preserves non-web protocols", () => {
    //* Arrange
    const postgres = "postgres://localhost:5432/db";
    const mailto = "mailto://user@example.com";
    const ftp = "ftp://files.example.com";

    //* Act
    const postgresResult = ensureProtocol(postgres);
    const mailtoResult = ensureProtocol(mailto);
    const ftpResult = ensureProtocol(ftp);

    //* Assert
    expect(postgresResult).toBe("postgres://localhost:5432/db");
    expect(mailtoResult).toBe("mailto://user@example.com");
    expect(ftpResult).toBe("ftp://files.example.com");
  });

  it("trims whitespace before checking", () => {
    //* Arrange
    const bare = "  example.com  ";
    const withProtocol = "  https://example.com  ";

    //* Act
    const bareResult = ensureProtocol(bare);
    const withProtocolResult = ensureProtocol(withProtocol);

    //* Assert
    expect(bareResult).toBe("https://example.com");
    expect(withProtocolResult).toBe("https://example.com");
  });

  it("is case-insensitive for protocol matching", () => {
    //* Arrange
    const upperHttps = "HTTPS://example.com";
    const upperHttp = "HTTP://example.com";

    //* Act
    const httpsResult = ensureProtocol(upperHttps);
    const httpResult = ensureProtocol(upperHttp);

    //* Assert
    expect(httpsResult).toBe("HTTPS://example.com");
    expect(httpResult).toBe("HTTP://example.com");
  });
});

describe("isSafeUrl", () => {
  it("allows a normal https URL", () => {
    //* Act
    const result = isSafeUrl("https://example.com");

    //* Assert
    expect(result).toBe(true);
  });

  it("allows a URL without protocol", () => {
    //* Act
    const result = isSafeUrl("example.com");

    //* Assert
    expect(result).toBe(true);
  });

  it("blocks javascript: URLs", () => {
    //* Act
    const result = isSafeUrl("javascript:alert(1)");

    //* Assert
    expect(result).toBe(false);
  });

  it("blocks JavaScript: URLs (case-insensitive)", () => {
    //* Act
    const result = isSafeUrl("JavaScript:alert(1)");

    //* Assert
    expect(result).toBe(false);
  });

  it("blocks data: URLs", () => {
    //* Act
    const result = isSafeUrl("data:text/html,<script>alert(1)</script>");

    //* Assert
    expect(result).toBe(false);
  });

  it("blocks vbscript: URLs", () => {
    //* Act
    const result = isSafeUrl("vbscript:MsgBox");

    //* Assert
    expect(result).toBe(false);
  });

  it("blocks anchr.to URLs", () => {
    //* Act
    const result = isSafeUrl("https://anchr.to/someone");

    //* Assert
    expect(result).toBe(false);
  });

  it("blocks www.anchr.to URLs", () => {
    //* Act
    const result = isSafeUrl("https://www.anchr.to/someone");

    //* Assert
    expect(result).toBe(false);
  });

  it("blocks anchr.to without protocol", () => {
    //* Act
    const result = isSafeUrl("anchr.to/someone");

    //* Assert
    expect(result).toBe(false);
  });

  it("allows anchr.to subdomains", () => {
    //* Act
    const result = isSafeUrl("https://blog.anchr.to/post");

    //* Assert
    expect(result).toBe(true);
  });

  it("blocks javascript: with leading whitespace", () => {
    //* Act
    const result = isSafeUrl("  javascript:alert(1)");

    //* Assert
    expect(result).toBe(false);
  });

  it("allows anchr.to when allowInternalHosts is true", () => {
    //* Act
    const result = isSafeUrl("https://anchr.to/someone", { allowInternalHosts: true });

    //* Assert
    expect(result).toBe(true);
  });

  it("still blocks javascript: when allowInternalHosts is true", () => {
    //* Act
    const result = isSafeUrl("javascript:alert(1)", { allowInternalHosts: true });

    //* Assert
    expect(result).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SSRF hardening — urlResolves() HEADs the user-supplied destination server-
  // side, so an attacker who can't reach private hosts themselves could use our
  // server as a proxy without these blocks. Exhaustively cover RFC1918, link-
  // local (inc. cloud metadata endpoints), CGNAT, loopback, and non-http
  // schemes.
  // ──────────────────────────────────────────────────────────────────────────

  it.each([
    ["http://127.0.0.1/", "IPv4 loopback"],
    ["http://127.5.5.5/", "IPv4 loopback any"],
    ["http://0.0.0.0/", "IPv4 0.0.0.0/8"],
    ["http://10.0.0.1/", "RFC1918 10/8"],
    ["http://10.255.255.255/", "RFC1918 10/8 max"],
    ["http://172.16.0.1/", "RFC1918 172.16/12 min"],
    ["http://172.31.255.255/", "RFC1918 172.16/12 max"],
    ["http://192.168.1.1/", "RFC1918 192.168/16"],
    ["http://169.254.169.254/latest/meta-data/", "AWS/GCP/Azure metadata"],
    ["http://100.64.0.1/", "CGNAT 100.64/10"],
    ["http://localhost/", "localhost literal"],
    ["http://foo.localhost/", "*.localhost suffix"],
    ["http://router.local/", ".local mDNS"],
    ["http://api.internal/", ".internal suffix"],
    ["http://intra.lan/", ".lan suffix"],
    ["http://[::1]/", "IPv6 loopback"],
    ["http://[fe80::1]/", "IPv6 link-local"],
    ["http://[fc00::1]/", "IPv6 unique-local"],
    ["http://[::ffff:10.0.0.1]/", "IPv4-mapped IPv6 private"],
  ])("blocks %s (%s) as SSRF target", (url) => {
    expect(isSafeUrl(url)).toBe(false);
  });

  it.each([["file:///etc/passwd"], ["ftp://example.com/"], ["gopher://example.com/"]])(
    "blocks non-http scheme %s",
    (url) => {
      expect(isSafeUrl(url)).toBe(false);
    },
  );

  it("allows internal hosts when allowInternalHosts is true (admin escape hatch)", () => {
    //* Act
    const result = isSafeUrl("http://10.0.0.1/admin", { allowInternalHosts: true });

    //* Assert
    expect(result).toBe(true);
  });

  it("allows a public IPv4", () => {
    //* Act
    const result = isSafeUrl("https://1.1.1.1/");

    //* Assert
    expect(result).toBe(true);
  });

  it("blocks the configured short domain to prevent redirect loops", () => {
    //* Arrange
    const prev = process.env.NEXT_PUBLIC_SHORT_DOMAIN;
    process.env.NEXT_PUBLIC_SHORT_DOMAIN = "anch.to";

    //* Act
    const result = isSafeUrl("https://anch.to/foo");
    const wwwResult = isSafeUrl("https://www.anch.to/foo");

    //* Assert — preventing loop: short_link destinations that point back at
    //  the short-URL host itself would bounce through the middleware forever
    //  until the browser's max-redirects kicks in.
    expect(result).toBe(false);
    expect(wwwResult).toBe(false);

    //* Cleanup
    if (prev == null) {
      delete process.env.NEXT_PUBLIC_SHORT_DOMAIN;
    } else {
      process.env.NEXT_PUBLIC_SHORT_DOMAIN = prev;
    }
  });
});

describe("generateSlug", () => {
  it("extracts domain name from a standard URL", () => {
    //* Act
    const result = generateSlug("https://youtube.com/watch?v=abc");

    //* Assert
    expect(result).toBe("youtube");
  });

  it("strips www. prefix", () => {
    //* Act
    const result = generateSlug("https://www.youtube.com/channel/xyz");

    //* Assert
    expect(result).toBe("youtube");
  });

  it("handles URLs without protocol", () => {
    //* Act
    const result = generateSlug("twitter.com/handle");

    //* Assert
    expect(result).toBe("twitter");
  });

  it("preserves single-part domain names for short TLDs", () => {
    //* Act
    const result = generateSlug("https://x.com/handle");

    //* Assert
    expect(result).toBe("x");
  });

  it("handles multi-part domain names", () => {
    //* Act
    const result = generateSlug("https://my-portfolio.io");

    //* Assert
    expect(result).toBe("my-portfolio");
  });

  it("handles country-code second-level TLDs (co.uk)", () => {
    //* Act
    const result = generateSlug("https://example.co.uk/page");

    //* Assert
    expect(result).toBe("example");
  });

  it("handles subdomains with country-code TLDs", () => {
    //* Act
    const result = generateSlug("https://blog.example.co.uk");

    //* Assert
    expect(result).toBe("blog-example");
  });

  it("handles subdomains", () => {
    //* Act
    const result = generateSlug("https://docs.google.com/spreadsheets");

    //* Assert
    expect(result).toBe("docs-google");
  });

  it("returns 'link' for empty or invalid input", () => {
    //* Act
    const result = generateSlug("???");

    //* Assert
    expect(result).toBe("link");
  });

  it("sanitizes special characters", () => {
    //* Act
    const result = generateSlug("https://my_site+test.com/page");

    //* Assert
    expect(result).toBe("my-site-test");
  });

  it("includes path segments when includePath is true", () => {
    //* Act
    const result = generateSlug("https://x.com/foo", true);

    //* Assert
    expect(result).toBe("x-foo");
  });

  it("includes multiple path segments when includePath is true", () => {
    //* Act
    const result = generateSlug("https://github.com/user/repo", true);

    //* Assert
    expect(result).toBe("github-user-repo");
  });

  it("returns domain-only slug when path is empty and includePath is true", () => {
    //* Act
    const result = generateSlug("https://x.com", true);

    //* Assert
    expect(result).toBe("x");
  });

  it("returns domain-only slug when path is just / and includePath is true", () => {
    //* Act
    const result = generateSlug("https://x.com/", true);

    //* Assert
    expect(result).toBe("x");
  });
});

describe("urlResolves", () => {
  it("returns true for a URL that responds with 200", async () => {
    //* Arrange
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    //* Act
    const result = await urlResolves("https://example.com");

    //* Assert
    expect(result).toBe(true);
    vi.restoreAllMocks();
  });

  it("returns false for a URL that responds with 404", async () => {
    //* Arrange
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    //* Act
    const result = await urlResolves("https://example.com/nonexistent");

    //* Assert
    expect(result).toBe(false);
    vi.restoreAllMocks();
  });

  it("returns false when fetch throws (network error)", async () => {
    //* Arrange
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    //* Act
    const result = await urlResolves("https://doesnotexist.invalid");

    //* Assert
    expect(result).toBe(false);
    vi.restoreAllMocks();
  });

  it("prepends https:// when no protocol is present", async () => {
    //* Arrange
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    //* Act
    await urlResolves("example.com");

    //* Assert
    expect(mockFetch).toHaveBeenCalledWith("https://example.com", expect.objectContaining({ method: "HEAD" }));
    vi.restoreAllMocks();
  });
});
