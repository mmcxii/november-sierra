import { describe, expect, it } from "vitest";
import { extractTokens, valueToCamelKey } from "./validate-i18n-keys";

describe("valueToCamelKey", () => {
  // ─── Basic camelCase ────────────────────────────────────────────────────────

  it("converts a simple word to lowercase", () => {
    //* Act
    const result = valueToCamelKey("Settings");

    //* Assert
    expect(result).toBe("settings");
  });

  it("camelCases multiple words", () => {
    //* Act
    const result = valueToCamelKey("Sign in");

    //* Assert
    expect(result).toBe("signIn");
  });

  it("camelCases a full sentence and strips punctuation", () => {
    //* Act
    const result = valueToCamelKey("Something went wrong. Please try again.");

    //* Assert
    expect(result).toBe("somethingWentWrongPleaseTryAgain");
  });

  // ─── Contractions ──────────────────────────────────────────────────────────

  it("collapses you'll into youll", () => {
    //* Act
    const result = valueToCamelKey("You'll continue to have access.");

    //* Assert
    expect(result).toBe("youllContinueToHaveAccess");
  });

  it("collapses don't into dont", () => {
    //* Act
    const result = valueToCamelKey("Don't have an account?");

    //* Assert
    expect(result).toBe("dontHaveAnAccount");
  });

  it("collapses we're into were", () => {
    //* Act
    const result = valueToCamelKey("We're already on it.");

    //* Assert
    expect(result).toBe("wereAlreadyOnIt");
  });

  it("collapses you're into youre", () => {
    //* Act
    const result = valueToCamelKey("You're just testing the waters.");

    //* Assert
    expect(result).toBe("youreJustTestingTheWaters");
  });

  it("collapses it's into its", () => {
    //* Act
    const result = valueToCamelKey("It's time to set sail.");

    //* Assert
    expect(result).toBe("itsTimeToSetSail");
  });

  it("collapses you've into youve", () => {
    //* Act
    const result = valueToCamelKey("You've reached the limit.");

    //* Assert
    expect(result).toBe("youveReachedTheLimit");
  });

  // ─── Possessives ───────────────────────────────────────────────────────────

  it("collapses possessive apostrophe", () => {
    //* Act
    const result = valueToCamelKey("The URL path for this group's shareable page.");

    //* Assert
    expect(result).toBe("theUrlPathForThisGroupsShareablePage");
  });

  // ─── Interpolation ─────────────────────────────────────────────────────────

  it("preserves {{variable}} tokens", () => {
    //* Act
    const result = valueToCamelKey("Hello, {{name}}!");

    //* Assert
    expect(result).toBe("hello{{name}}");
  });

  it("preserves tokens mid-sentence", () => {
    //* Act
    const result = valueToCamelKey("Pro access expires on {{date}}.");

    //* Assert
    expect(result).toBe("proAccessExpiresOn{{date}}");
  });

  it("preserves multiple tokens", () => {
    //* Act
    const result = valueToCamelKey("{{count}} links deleted.");

    //* Assert
    expect(result).toBe("{{count}}LinksDeleted");
  });

  it("handles token with surrounding text", () => {
    //* Act
    const result = valueToCamelKey("{{label}} ({{px}}px)");

    //* Assert
    expect(result).toBe("{{label}}{{px}}Px");
  });

  it("handles token at the end of key", () => {
    //* Act
    const result = valueToCamelKey("Your page is live at {{url}}.");

    //* Assert
    expect(result).toBe("yourPageIsLiveAt{{url}}");
  });

  // ─── HTML tags ─────────────────────────────────────────────────────────────

  it("strips HTML tags", () => {
    //* Act
    const result = valueToCamelKey("Don't have an account? <1>Sign up</1>");

    //* Assert
    expect(result).toBe("dontHaveAnAccountSignUp");
  });

  // ─── Ampersand ─────────────────────────────────────────────────────────────

  it("expands & to And", () => {
    //* Act
    const result = valueToCamelKey("Save & Add Another");

    //* Assert
    expect(result).toBe("saveAndAddAnother");
  });

  // ─── Currency ──────────────────────────────────────────────────────────────

  it("preserves leading $ for currency", () => {
    //* Act
    const result = valueToCamelKey("$5/mo");

    //* Assert
    expect(result).toBe("$5Mo");
  });

  it("preserves $ in middle of sentence", () => {
    //* Act
    const result = valueToCamelKey("Save $24");

    //* Assert
    expect(result).toBe("save$24");
  });

  // ─── Numbers ───────────────────────────────────────────────────────────────

  it("preserves leading numbers", () => {
    //* Act
    const result = valueToCamelKey("4 themes");

    //* Assert
    expect(result).toBe("4Themes");
  });

  // ─── Edge cases ────────────────────────────────────────────────────────────

  it("returns empty string for whitespace-only input", () => {
    //* Act
    const result = valueToCamelKey("   ");

    //* Assert
    expect(result).toBe("");
  });

  it("handles single word with no caps change needed", () => {
    //* Act
    const result = valueToCamelKey("Links");

    //* Assert
    expect(result).toBe("links");
  });

  it("handles URL-like content in value", () => {
    //* Act
    const result = valueToCamelKey("This will be your unique anchr.to URL.");

    //* Assert
    expect(result).toBe("thisWillBeYourUniqueAnchrToUrl");
  });

  it("handles unicode dash in value", () => {
    //* Act
    const result = valueToCamelKey("Your name — a link that's yours.");

    //* Assert
    expect(result).toBe("yourNameALinkThatsYours");
  });
});

describe("extractTokens", () => {
  it("returns empty array for plain text", () => {
    //* Act
    const result = extractTokens("Hello world");

    //* Assert
    expect(result).toEqual([]);
  });

  it("extracts a single token", () => {
    //* Act
    const result = extractTokens("Hello, {{name}}!");

    //* Assert
    expect(result).toEqual(["{{name}}"]);
  });

  it("extracts multiple tokens sorted alphabetically", () => {
    //* Act
    const result = extractTokens("{{count}} items for {{name}}");

    //* Assert
    expect(result).toEqual(["{{count}}", "{{name}}"]);
  });

  it("extracts duplicate tokens once each", () => {
    //* Act
    const result = extractTokens("{{name}} met {{name}}");

    //* Assert
    expect(result).toEqual(["{{name}}", "{{name}}"]);
  });
});
