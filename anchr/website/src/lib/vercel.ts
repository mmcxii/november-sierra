import { envSchema } from "@/lib/env";

type VercelApiResult<T> = { data: T; ok: true } | { error: string; ok: false };

function buildUrl(path: string): string {
  const base = `https://api.vercel.com${path}`;
  const teamId = envSchema.VERCEL_TEAM_ID;
  return teamId != null ? `${base}?teamId=${teamId}` : base;
}

async function vercelFetch<T>(path: string, init?: RequestInit): Promise<VercelApiResult<T>> {
  try {
    const response = await fetch(buildUrl(path), {
      ...init,
      headers: {
        Authorization: `Bearer ${envSchema.VERCEL_API_TOKEN}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    const body = await response.json();

    if (!response.ok) {
      return { error: body.error?.message ?? "Unknown Vercel API error", ok: false };
    }

    return { data: body as T, ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error", ok: false };
  }
}

type AddDomainResponse = { name: string; verified: boolean };

export async function addDomain(domain: string): Promise<VercelApiResult<AddDomainResponse>> {
  return vercelFetch<AddDomainResponse>(`/v10/projects/${envSchema.VERCEL_PROJECT_ID}/domains`, {
    body: JSON.stringify({ name: domain }),
    method: "POST",
  });
}

export async function removeDomain(domain: string): Promise<VercelApiResult<void>> {
  return vercelFetch<void>(`/v10/projects/${envSchema.VERCEL_PROJECT_ID}/domains/${domain}`, {
    method: "DELETE",
  });
}

type DomainConfigResponse = { misconfigured: boolean };

export async function getDomainConfig(domain: string): Promise<VercelApiResult<DomainConfigResponse>> {
  return vercelFetch<DomainConfigResponse>(`/v6/domains/${domain}/config`);
}

type VerifyDomainResponse = { verified: boolean };

export async function verifyDomain(domain: string): Promise<VercelApiResult<VerifyDomainResponse>> {
  return vercelFetch<VerifyDomainResponse>(`/v10/projects/${envSchema.VERCEL_PROJECT_ID}/domains/${domain}/verify`, {
    method: "POST",
  });
}
