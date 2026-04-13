/** Strip HTML tags from a string. */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

/** Extract the hostname from a URL, or return the original string on parse failure. */
export function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
