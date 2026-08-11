import type { ChallengeProgressSlice } from "@/lib/challenge/progress";

export const SLICE_CLASS: Record<ChallengeProgressSlice, string> = {
  complete: "bg-sf-accent",
  failed: "bg-sf-danger",
  future: "bg-transparent",
  missed: "bg-sf-muted/55",
  pending: "bg-transparent",
};
