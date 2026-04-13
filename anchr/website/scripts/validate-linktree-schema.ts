/**
 * Contract drift detection for Linktree's __NEXT_DATA__ structure.
 *
 * Fetches a known public Linktree page and validates that the JSON schema
 * still matches our parser expectations. Run manually to detect breaking
 * changes before users report failed imports.
 *
 * Usage: npx tsx scripts/validate-linktree-schema.ts
 */

const TARGET_URL = "https://linktr.ee/selenagomez";

async function main() {
  console.log(`Fetching ${TARGET_URL}...`);

  const response = await fetch(TARGET_URL, {
    headers: {
      Accept: "text/html",
      "User-Agent": "AnchrBot/1.0 (+https://anchr.to)",
    },
  });

  if (!response.ok) {
    console.error(`HTTP ${response.status} — failed to fetch page`);
    process.exit(1);
  }

  const html = await response.text();

  // Extract __NEXT_DATA__
  const marker = '<script id="__NEXT_DATA__"';
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) {
    console.error("DRIFT DETECTED: __NEXT_DATA__ script tag not found");
    process.exit(1);
  }

  const jsonStart = html.indexOf(">", startIdx);
  const jsonEnd = html.indexOf("</script>", jsonStart);
  const jsonStr = html.slice(jsonStart + 1, jsonEnd);

  let data: unknown;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    console.error("DRIFT DETECTED: __NEXT_DATA__ contains invalid JSON");
    process.exit(1);
  }

  // Validate expected structure
  const errors: string[] = [];

  function check(path: string, value: unknown, expectedType: string) {
    if (expectedType === "array") {
      if (!Array.isArray(value)) {
        errors.push(`${path}: expected array, got ${typeof value}`);
      }
    } else if (typeof value !== expectedType) {
      errors.push(`${path}: expected ${expectedType}, got ${typeof value}`);
    }
  }

  const root = data as Record<string, unknown>;
  const props = root?.props as undefined | Record<string, unknown>;
  const pageProps = props?.pageProps as undefined | Record<string, unknown>;

  if (pageProps == null) {
    console.error("DRIFT DETECTED: props.pageProps is missing");
    process.exit(1);
  }

  // Account structure
  const account = pageProps.account as undefined | Record<string, unknown>;
  if (account == null) {
    errors.push("pageProps.account: missing");
  } else {
    check("account.username", account.username, "string");
    // pageTitle and description may be string or null — just verify key exists
    if (!("pageTitle" in account)) {errors.push("account.pageTitle: missing key");}
    if (!("description" in account)) {errors.push("account.description: missing key");}
    if (!("profilePictureUrl" in account)) {errors.push("account.profilePictureUrl: missing key");}
  }

  // Links array
  check("pageProps.links", pageProps.links, "array");
  if (Array.isArray(pageProps.links) && pageProps.links.length > 0) {
    const firstLink = pageProps.links[0] as Record<string, unknown>;
    if (!("title" in firstLink)) {errors.push("links[0].title: missing key");}
    if (!("url" in firstLink)) {errors.push("links[0].url: missing key");}
    if (!("type" in firstLink)) {errors.push("links[0].type: missing key");}
    if (!("position" in firstLink)) {errors.push("links[0].position: missing key");}
  }

  // Social links array
  check("pageProps.socialLinks", pageProps.socialLinks, "array");
  if (Array.isArray(pageProps.socialLinks) && pageProps.socialLinks.length > 0) {
    const firstSocial = pageProps.socialLinks[0] as Record<string, unknown>;
    if (!("type" in firstSocial)) {errors.push("socialLinks[0].type: missing key");}
    if (!("url" in firstSocial)) {errors.push("socialLinks[0].url: missing key");}
  }

  if (errors.length > 0) {
    console.error("DRIFT DETECTED:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  const linkCount = (pageProps.links as unknown[]).length;
  const socialCount = (pageProps.socialLinks as unknown[]).length;
  console.log(`OK — schema valid. ${linkCount} links, ${socialCount} social links found.`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
