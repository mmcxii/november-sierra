export const CAPABILITIES = [
  "machineReadableProfilesJsonLdStructuredData",
  "openRestApiWithOpenapiSpec",
  "mcpServerForAiAssistants",
  "compatibleWithOpenclawChatgptClaudeGeminiCursorAndAnyAgentThatSpeaksMcpOrCallsRestApis",
  "discoveryFilesAnchrJsonLlmsTxt",
] as const;

// Ordered with OpenClaw first to lead the SEO keyword density. All clients
// below speak MCP directly (ChatGPT/Claude Desktop, Claude Code, Cursor,
// Windsurf, Zed, Goose, Cline, Copilot Studio) or call REST APIs via
// function-calling (OpenAI Agents SDK, Google Gemini). The "any agent" copy
// covers everything else.
export const COMPATIBLE_CLIENTS = [
  "OpenClaw",
  "ChatGPT Desktop",
  "Claude Desktop",
  "Claude Code",
  "Claude Agent SDK",
  "Google Gemini",
  "OpenAI Agents SDK",
  "Cursor",
  "Windsurf",
  "Zed",
  "Goose",
  "Cline",
  "Copilot Studio",
] as const;

export const COMPARISON_ROWS = [
  { anchr: true, feature: "publicApi", other: false },
  { anchr: true, feature: "jsonLdStructuredData", other: false },
  { anchr: true, feature: "mcpServerForAiAssistants", other: false },
  { anchr: true, feature: "discoveryFilesAnchrJsonLlmsTxt", other: false },
  { anchr: true, feature: "agentDiscoveryFlow", other: false },
  { anchr: true, feature: "customDomains", other: "some" as const },
] as const;
