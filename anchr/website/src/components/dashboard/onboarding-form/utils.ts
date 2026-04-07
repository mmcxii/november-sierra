export const STEPS = ["username", "link", "theme", "complete"] as const;
export type Step = (typeof STEPS)[number];
