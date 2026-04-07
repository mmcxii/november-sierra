import { detectPlatform } from "@/lib/platforms";
import { ensureProtocol, generateSlug } from "@/lib/utils/url";

export function resolveDetectedPlatform(isNostrMode: boolean, urlValue: undefined | string): null | string {
  if (isNostrMode) {
    return "nostr";
  }
  if (urlValue != null && urlValue.length > 0) {
    return detectPlatform(urlValue);
  }
  return null;
}

export function resolveSlugPlaceholder(isNostrMode: boolean, urlValue: undefined | string): string {
  if (isNostrMode) {
    return "nostr";
  }
  if (urlValue != null && urlValue.length > 0) {
    return generateSlug(ensureProtocol(urlValue));
  }
  return "";
}
