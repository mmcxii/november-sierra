export const TABS = ["curl", "javascript", "python", "mcpPrompt"] as const;

export type TabId = (typeof TABS)[number];

const CURL_HTML = `<span class="text-[#7ee787]">curl</span> <span class="text-[#a5d6ff]">https://anchr.to/api/v1/users/a</span>`;

const JS_HTML = `<span class="text-[#ff7b72]">const</span> response = <span class="text-[#ff7b72]">await</span> <span class="text-[#d2a8ff]">fetch</span>(<span class="text-[#a5d6ff]">&quot;https://anchr.to/api/v1/users/a&quot;</span>);
<span class="text-[#ff7b72]">const</span> { data } = <span class="text-[#ff7b72]">await</span> response.<span class="text-[#d2a8ff]">json</span>();

console.<span class="text-[#d2a8ff]">log</span>(data.displayName); <span class="text-[#8b949e]">// &quot;Anchr&quot;</span>
console.<span class="text-[#d2a8ff]">log</span>(data.links);       <span class="text-[#8b949e]">// [{ title, url, ... }]</span>`;

const PYTHON_HTML = `<span class="text-[#ff7b72]">import</span> requests

response = requests.<span class="text-[#d2a8ff]">get</span>(<span class="text-[#a5d6ff]">&quot;https://anchr.to/api/v1/users/a&quot;</span>)
data = response.<span class="text-[#d2a8ff]">json</span>()[<span class="text-[#a5d6ff]">&quot;data&quot;</span>]

<span class="text-[#d2a8ff]">print</span>(data[<span class="text-[#a5d6ff]">&quot;displayName&quot;</span>])  <span class="text-[#8b949e]"># &quot;Anchr&quot;</span>
<span class="text-[#d2a8ff]">print</span>(data[<span class="text-[#a5d6ff]">&quot;links&quot;</span>])        <span class="text-[#8b949e]"># [{ title, url, ... }]</span>`;

const MCP_HTML = `<span class="text-[#8b949e]"># Natural language via MCP</span>

<span class="text-[#a5d6ff]">&quot;Add my new blog post to my Anchr page&quot;</span>

<span class="text-[#8b949e]"># Your AI assistant will:</span>
<span class="text-[#8b949e]"># 1. Connect to Anchr via MCP</span>
<span class="text-[#8b949e]"># 2. Create a new link with your blog URL</span>
<span class="text-[#8b949e]"># 3. Confirm it&apos;s live on your page</span>`;

export const CODE_EXAMPLES: Record<TabId, string> = {
  curl: CURL_HTML,
  javascript: JS_HTML,
  mcpPrompt: MCP_HTML,
  python: PYTHON_HTML,
};
