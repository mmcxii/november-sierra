const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(prefix: string): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return `${prefix}-${code}`;
}
