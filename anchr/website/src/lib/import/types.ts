import type { PlatformId } from "../platforms";

export type ImportedLink = {
  platform: null | PlatformId;
  position: number;
  title: string;
  url: string;
  visible: boolean;
};

export type ImportedProfile = {
  avatarUrl: null | string;
  bio: null | string;
  displayName: null | string;
};

type ImportSource = "generic" | "linktree";

export type ImportedPage = {
  links: ImportedLink[];
  profile: ImportedProfile;
  source: ImportSource;
};
