import { randomBytes } from "node:crypto";

export function generateGroupPassword(): string {
  return randomBytes(48).toString("base64url").slice(0, 64);
}
