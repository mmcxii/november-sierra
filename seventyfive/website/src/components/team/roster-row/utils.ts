import { type ChallengeMode, type MemberStatus } from "@/lib/challenge/tasks";
import type { TranslationKey } from "@/lib/i18n/i18next";

export type RosterStatusLabelInput = {
  mode: ChallengeMode;
  softStumble: boolean;
  status: MemberStatus;
};

export function rosterStatusLabel(input: RosterStatusLabelInput): null | TranslationKey {
  if (input.status === "failed" || input.status === "exited") {
    return "failed";
  }
  if (input.mode === "soft" && input.softStumble) {
    return "offTrack";
  }
  return null;
}
