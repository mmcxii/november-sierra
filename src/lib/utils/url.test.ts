import { describe, expect, it } from "vitest";
import { ensureProtocol } from "./url";

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
