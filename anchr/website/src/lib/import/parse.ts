import { parseGeneric } from "./parsers/generic";
import { isLinktreeData, parseLinktree } from "./parsers/linktree";
import type { ImportedPage } from "./types";

/** Extract `__NEXT_DATA__` JSON from an HTML string if present. */
function extractNextData(html: string): null | unknown {
  const marker = '<script id="__NEXT_DATA__"';
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) {
    return null;
  }

  const jsonStart = html.indexOf(">", startIdx);
  if (jsonStart === -1) {
    return null;
  }

  const jsonEnd = html.indexOf("</script>", jsonStart);
  if (jsonEnd === -1) {
    return null;
  }

  const jsonStr = html.slice(jsonStart + 1, jsonEnd);
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Parse an HTML page into an `ImportedPage`.
 *
 * Detection is content-based: if `__NEXT_DATA__` is present and matches
 * Linktree's fingerprint, we use the Linktree parser. Otherwise we fall
 * back to the generic DOM parser. This handles Linktree Pro custom domains.
 */
export function parsePage(html: string, sourceUrl: string): ImportedPage {
  const nextData = extractNextData(html);

  if (nextData != null && isLinktreeData(nextData)) {
    return parseLinktree(nextData);
  }

  return parseGeneric(html, sourceUrl);
}
