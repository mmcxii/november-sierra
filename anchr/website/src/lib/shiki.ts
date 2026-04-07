import { type BundledLanguage, codeToHtml } from "shiki";

const THEME = "github-dark";

/**
 * Highlight a code string to HTML using shiki (server-only, zero client JS).
 * Returns only the inner HTML of the `<code>` element — no wrapping `<pre>`.
 */
export async function highlight(code: string, lang: BundledLanguage): Promise<string> {
  const html = await codeToHtml(code, { lang, theme: THEME });

  // shiki wraps in <pre class="..."><code>...</code></pre>
  // Extract just the <code> inner content for flexible rendering.
  const codeMatch = html.match(/<code[^>]*>([\s\S]*)<\/code>/);
  return codeMatch?.[1] ?? html;
}
