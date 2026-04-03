export const TABS = ["curl", "javascript", "python", "mcpPrompt"] as const;

export type TabId = (typeof TABS)[number];

export const CODE_SOURCES: Record<TabId, string> = {
  curl: `curl https://anchr.to/api/v1/users/a`,
  javascript: `const response = await fetch("https://anchr.to/api/v1/users/a");
const { data } = await response.json();

console.log(data.displayName); // "Anchr"
console.log(data.links);       // [{ title, url, ... }]`,
  mcpPrompt: `# Natural language via MCP

"Add my new blog post to my Anchr page"

# Your AI assistant will:
# 1. Connect to Anchr via MCP
# 2. Create a new link with your blog URL
# 3. Confirm it's live on your page`,
  python: `import requests

response = requests.get("https://anchr.to/api/v1/users/a")
data = response.json()["data"]

print(data["displayName"])  # "Anchr"
print(data["links"])        # [{ title, url, ... }]`,
};

export const LANG_MAP: Record<TabId, string> = {
  curl: "bash",
  javascript: "javascript",
  mcpPrompt: "bash",
  python: "python",
};
