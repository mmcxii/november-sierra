export const TABS = ["curl", "javascript", "python", "mcpPrompt"] as const;

export type TabId = (typeof TABS)[number];

export const CODE_SOURCES: Record<TabId, string> = {
  curl: `# Fetch a public profile
curl https://anchr.to/api/v1/users/a

# Shorten a URL (requires API key)
curl -X POST https://anchr.to/api/v1/short-links \\
  -H "Authorization: Bearer $ANCHR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/long-path"}'`,
  javascript: `// Fetch a public profile
const profile = await fetch("https://anchr.to/api/v1/users/a").then((r) => r.json());
console.log(profile.data.displayName); // "Anchr"

// Shorten a URL (requires API key)
const shortLink = await fetch("https://anchr.to/api/v1/short-links", {
  body: JSON.stringify({ url: "https://example.com/long-path" }),
  headers: {
    "Authorization": \`Bearer \${process.env.ANCHR_API_KEY}\`,
    "Content-Type": "application/json",
  },
  method: "POST",
}).then((r) => r.json());
console.log(shortLink.data.shortUrl); // "https://anch.to/abc23"`,
  mcpPrompt: `# Natural language via MCP

"Add my new blog post to my Anchr page"
"Shorten https://example.com/long-path for me"

# Your AI assistant will:
# 1. Connect to Anchr via MCP
# 2. Pick the right tool (create_link or create_short_link)
# 3. Return the result inline, ready to share`,
  python: `import os, requests

# Fetch a public profile
profile = requests.get("https://anchr.to/api/v1/users/a").json()
print(profile["data"]["displayName"])  # "Anchr"

# Shorten a URL (requires API key)
short_link = requests.post(
    "https://anchr.to/api/v1/short-links",
    headers={"Authorization": f"Bearer {os.environ['ANCHR_API_KEY']}"},
    json={"url": "https://example.com/long-path"},
).json()
print(short_link["data"]["shortUrl"])  # "https://anch.to/abc23"`,
};

export const LANG_MAP: Record<TabId, string> = {
  curl: "bash",
  javascript: "javascript",
  mcpPrompt: "bash",
  python: "python",
};
