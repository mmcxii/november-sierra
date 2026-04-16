import { envSchema } from "@/lib/env";

export const SHORT_DOMAIN = envSchema.NEXT_PUBLIC_SHORT_DOMAIN;

export function shortDomainUrl(slug: string): string {
  return `https://${SHORT_DOMAIN}/${slug}`;
}
