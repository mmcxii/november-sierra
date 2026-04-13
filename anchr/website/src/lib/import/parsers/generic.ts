import { detectPlatform } from "../../platforms";
import type { ImportedLink, ImportedPage, ImportedProfile } from "../types";
import { hostnameFromUrl, stripHtml } from "../utils";

/** Extract the value of a `<meta>` tag by property or name attribute. */
function extractMeta(html: string, attr: string): null | string {
  // Match property="attr" or name="attr"
  const pattern = new RegExp(
    `<meta\\s+[^>]*(?:property|name)=["']${attr}["'][^>]*content=["']([^"']*)["']` +
      `|<meta\\s+[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${attr}["']`,
    "i",
  );
  const match = html.match(pattern);
  if (match == null) {
    return null;
  }
  const value = (match[1] ?? match[2] ?? "").trim();
  return value.length > 0 ? stripHtml(value) : null;
}

/** Extract all `<a href>` URLs that look like external links. */
function extractLinks(html: string, sourceUrl: string): { title: string; url: string }[] {
  const linkPattern = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const results: { title: string; url: string }[] = [];
  let match: null | RegExpExecArray;

  let sourceHostname: string;
  try {
    sourceHostname = new URL(sourceUrl).hostname;
  } catch {
    sourceHostname = "";
  }

  while ((match = linkPattern.exec(html)) != null) {
    const href = match[1].trim();
    const rawTitle = match[2];

    // Skip anchors, fragments, relative paths, mailto, tel, javascript
    if (
      href.startsWith("#") ||
      href.startsWith("/") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      continue;
    }

    // Must be a valid HTTP(S) URL
    let parsed: URL;
    try {
      parsed = new URL(href.startsWith("http") ? href : `https://${href}`);
    } catch {
      continue;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      continue;
    }

    // Skip links pointing back to the same domain (navigation links)
    if (parsed.hostname === sourceHostname) {
      continue;
    }

    const title = stripHtml(rawTitle);

    results.push({
      title: title.length > 0 ? title : hostnameFromUrl(href),
      url: parsed.href,
    });
  }

  return results;
}

/**
 * Generic parser — extracts links and profile data from any HTML page.
 * Uses `<meta>` tags for profile info and `<a>` tags for links.
 */
export function parseGeneric(html: string, sourceUrl: string): ImportedPage {
  const profile: ImportedProfile = {
    avatarUrl: extractMeta(html, "og:image"),
    bio: extractMeta(html, "og:description") ?? extractMeta(html, "description"),
    displayName: extractMeta(html, "og:title"),
  };

  const rawLinks = extractLinks(html, sourceUrl);

  // Deduplicate by URL
  const seen = new Set<string>();
  const importedLinks: ImportedLink[] = [];

  for (const link of rawLinks) {
    const normalized = link.url.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);

    importedLinks.push({
      platform: detectPlatform(link.url),
      position: importedLinks.length,
      title: link.title,
      url: link.url,
      visible: true,
    });
  }

  return { links: importedLinks, profile, source: "generic" };
}
