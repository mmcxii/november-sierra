import { detectPlatform } from "../../platforms";
import type { ImportedLink, ImportedPage, ImportedProfile } from "../types";
import { hostnameFromUrl, stripHtml } from "../utils";

/**
 * Linktree-specific shape inside `__NEXT_DATA__` → `props.pageProps`.
 * Only the fields we need — the real payload has many more.
 */
type LinktreePageProps = {
  account?: {
    description?: string;
    pageTitle?: string;
    profilePictureUrl?: null | string;
    username?: string;
  };
  links?: LinktreeLink[];
  socialLinks?: { type?: string; url?: string }[];
};

type LinktreeLink = {
  position?: number;
  title?: string;
  type?: string;
  url?: string;
};

/**
 * Detect whether a parsed `__NEXT_DATA__` JSON blob is from Linktree.
 *
 * Content-based fingerprint — works regardless of domain (handles custom domains).
 */
export function isLinktreeData(nextData: unknown): nextData is { props: { pageProps: LinktreePageProps } } {
  if (typeof nextData !== "object" || nextData == null) {
    return false;
  }

  const root = nextData as Record<string, unknown>;
  const props = root.props as undefined | Record<string, unknown>;
  if (typeof props !== "object" || props == null) {
    return false;
  }

  const pageProps = props.pageProps as undefined | Record<string, unknown>;
  if (typeof pageProps !== "object" || pageProps == null) {
    return false;
  }

  // Linktree fingerprint: has `account` with `username` and `links` array
  const account = pageProps.account as undefined | Record<string, unknown>;
  if (typeof account !== "object" || account == null) {
    return false;
  }
  if (typeof account.username !== "string") {
    return false;
  }
  if (!Array.isArray(pageProps.links)) {
    return false;
  }

  return true;
}

/**
 * Parse a confirmed Linktree `__NEXT_DATA__` blob into an `ImportedPage`.
 */
export function parseLinktree(nextData: { props: { pageProps: LinktreePageProps } }): ImportedPage {
  const { account, links = [], socialLinks = [] } = nextData.props.pageProps;

  const profile: ImportedProfile = {
    avatarUrl: account?.profilePictureUrl ?? null,
    bio: account?.description ? stripHtml(account.description) : null,
    displayName: account?.pageTitle ? stripHtml(account.pageTitle) : null,
  };

  // Collect social link URLs so we can merge them with main links
  const socialUrls = socialLinks
    .filter((s): s is { type: string; url: string } => typeof s.url === "string" && s.url.length > 0)
    .map((s) => s.url);

  // Parse main links — only CLASSIC type (skip HEADER, MUSIC_PLAYER, etc.)
  const seen = new Set<string>();
  const importedLinks: ImportedLink[] = [];

  for (const link of links) {
    if (typeof link.url !== "string" || link.url.length === 0) {
      continue;
    }
    if (link.type != null && link.type !== "CLASSIC") {
      continue;
    }

    const normalized = link.url.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);

    const strippedTitle = link.title != null ? stripHtml(link.title) : "";
    const title = strippedTitle.length > 0 ? strippedTitle : hostnameFromUrl(link.url);

    importedLinks.push({
      platform: detectPlatform(link.url),
      position: importedLinks.length,
      title,
      url: link.url,
      visible: true,
    });
  }

  // Add social links that aren't already in main links
  for (const url of socialUrls) {
    const normalized = url.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);

    importedLinks.push({
      platform: detectPlatform(url),
      position: importedLinks.length,
      title: hostnameFromUrl(url),
      url,
      visible: true,
    });
  }

  return { links: importedLinks, profile, source: "linktree" };
}
