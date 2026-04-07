type CodeLike = {
  active: boolean;
  currentRedemptions: number;
  expiresAt: null | Date;
  maxRedemptions: null | number;
};

export function getCodeStatus(code: CodeLike): "active" | "deactivated" | "exhausted" | "expired" {
  if (!code.active) {
    return "deactivated";
  }

  if (code.expiresAt != null && code.expiresAt < new Date()) {
    return "expired";
  }

  if (code.maxRedemptions != null && code.currentRedemptions >= code.maxRedemptions) {
    return "exhausted";
  }

  return "active";
}
