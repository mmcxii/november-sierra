import { randomBytes } from "node:crypto";

export function generateTeamPassword(): string {
  return randomBytes(48).toString("base64url").slice(0, 64);
}
