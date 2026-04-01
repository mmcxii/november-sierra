export const CAPABILITIES = [
  "machineReadableProfilesJsonLdStructuredData",
  "openRestApiWithOpenapiSpec",
  "mcpServerForAiAssistants",
  "discoveryFilesAnchrJsonLlmsTxt",
] as const;

export const COMPARISON_ROWS = [
  { anchr: true, feature: "publicApi", other: false },
  { anchr: true, feature: "jsonLdStructuredData", other: false },
  { anchr: true, feature: "mcpServerForAiAssistants", other: false },
  { anchr: true, feature: "discoveryFilesAnchrJsonLlmsTxt", other: false },
  { anchr: true, feature: "agentDiscoveryFlow", other: false },
  { anchr: true, feature: "customDomains", other: "some" as const },
] as const;
