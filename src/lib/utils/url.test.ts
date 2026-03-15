import { describe, expect, it, vi } from "vitest";
import { ensureProtocol, isSafeUrl, urlResolves } from "./url";

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
