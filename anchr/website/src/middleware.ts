import { rateLimitRequest, rateLimitShortUrlRedirect } from "@/lib/api/rate-limit";
import { defaultLocale } from "@/lib/i18n/config";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/onboarding(.*)"]);
const isApiV1Route = createRouteMatcher(["/api/v1(.*)"]);

// ─── Custom Domain Cache ─────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const domainCache = new Map<string, { expiresAt: number; username: string }>();

function getAppHosts(): Set<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl == null) {
    return new Set();
  }
  try {
    const host = new URL(appUrl).host;
    return new Set([host, `www.${host}`]);
  } catch {
    return new Set();
  }
}

async function resolveCustomDomain(host: string): Promise<null | string> {
  const cached = domainCache.get(host);
  if (cached != null && Date.now() < cached.expiresAt) {
    return cached.username;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl == null) {
    return null;
  }

  try {
    const sql = neon(databaseUrl);
    // Tier filter is defense-in-depth: handleDowngrade / cleanupExpiredPro
    // should have cleared the custom_domain columns when tier dropped, but a
    // missed cleanup (Vercel API down during downgrade, etc.) shouldn't leave
    // the domain resolving indefinitely.
    const rows = await sql`
      SELECT username FROM users
      WHERE custom_domain = ${host}
        AND custom_domain_verified = true
        AND tier = 'pro'
        AND (pro_expires_at IS NULL OR pro_expires_at > now())
      LIMIT 1
    `;
    const username = rows[0]?.username as undefined | string;
    if (username != null) {
      domainCache.set(host, { expiresAt: Date.now() + CACHE_TTL_MS, username });
      return username;
    }
  } catch (error) {
    console.error("[middleware] custom domain lookup failed:", error);
  }

  return null;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

function getShortDomainHosts(): Set<string> {
  const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN;
  if (shortDomain == null || shortDomain.length === 0) {
    return new Set();
  }
  return new Set([shortDomain, `www.${shortDomain}`]);
}

async function resolveShortDomain(host: string): Promise<null | string> {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl == null) {
    return null;
  }

  try {
    const sql = neon(databaseUrl);
    // Same defense-in-depth tier gate as resolveCustomDomain: a downgraded
    // pro user must not keep a custom short-URL host resolving even if the
    // cleanup path missed clearing the DB columns.
    const rows = await sql`
      SELECT username FROM users
      WHERE short_domain = ${host}
        AND short_domain_verified = true
        AND tier = 'pro'
        AND (pro_expires_at IS NULL OR pro_expires_at > now())
      LIMIT 1
    `;
    return (rows[0]?.username as undefined | string) ?? null;
  } catch (error) {
    console.error("[middleware] short domain lookup failed:", error);
    return null;
  }
}

export default clerkMiddleware(async (auth, req) => {
  const host = req.headers.get("host") ?? "";

  // ─── Short Domain Redirect ─────────────────────────────────────────────────
  const shortDomainHosts = getShortDomainHosts();
  if (shortDomainHosts.has(host)) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://anchr.to";
    const pathname = req.nextUrl.pathname;
    const segments = pathname.split("/").filter(Boolean);

    // Root path → redirect to main app
    if (segments.length === 0) {
      return NextResponse.redirect(appUrl, 302);
    }

    // Single segment → short slug redirect (rewrite to internal /r/[slug] route)
    if (segments.length === 1) {
      // Per-IP rate limit on redirect traffic to throttle slug enumeration.
      // Fails open (Redis outage → allow) to avoid breaking real users.
      const limitResult = await rateLimitShortUrlRedirect(req);
      if (limitResult.limited && limitResult.response != null) {
        return limitResult.response;
      }
      const rewriteUrl = new URL(`/r/${segments[0]}`, req.url);
      const response = NextResponse.rewrite(rewriteUrl);
      response.headers.set("x-short-domain", host);
      response.headers.set("x-next-i18n-router-locale", defaultLocale);
      return response;
    }

    // Multi-segment → redirect to main app
    return NextResponse.redirect(appUrl, 302);
  }

  // ─── Custom Short Domain ──────────────────────────────────────────────────
  const appHosts = getAppHosts();
  const isAppHost = appHosts.size === 0 || appHosts.has(host);

  if (!isAppHost) {
    // Check if this is a custom short domain
    const shortDomainUsername = await resolveShortDomain(host);
    if (shortDomainUsername != null) {
      const pathname = req.nextUrl.pathname;
      const segments = pathname.split("/").filter(Boolean);

      if (segments.length === 0) {
        // Root → redirect to user's profile
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://anchr.to";
        return NextResponse.redirect(`${appUrl}/${shortDomainUsername}`, 302);
      }

      if (segments.length === 1) {
        // Same per-IP rate limit as the default short domain branch — both
        // endpoints are equally attractive enumeration targets.
        const limitResult = await rateLimitShortUrlRedirect(req);
        if (limitResult.limited && limitResult.response != null) {
          return limitResult.response;
        }
        // Single segment → rewrite to short link redirect route
        const rewriteUrl = new URL(`/r/${segments[0]}`, req.url);
        const response = NextResponse.rewrite(rewriteUrl);
        response.headers.set("x-short-domain", host);
        response.headers.set("x-short-domain-username", shortDomainUsername);
        response.headers.set("x-next-i18n-router-locale", defaultLocale);
        return response;
      }

      return new NextResponse(null, { status: 404 });
    }
  }

  // ─── Rate Limiting (API v1 only) ────────────────────────────────────────────
  if (isApiV1Route(req)) {
    const { headers: rateLimitHeaders, limited, response } = await rateLimitRequest(req);

    if (limited && response != null) {
      return response;
    }

    // Attach rate limit headers — they'll be merged into the final response
    const next = NextResponse.next();
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      next.headers.set(key, value);
    }
    next.headers.set("x-next-i18n-router-locale", defaultLocale);
    return next;
  }

  // Custom domain routing (profile domains)
  if (!isAppHost) {
    const username = await resolveCustomDomain(host);

    if (username == null) {
      return NextResponse.next();
    }

    const pathname = req.nextUrl.pathname;
    const segments = pathname.split("/").filter(Boolean);

    let rewriteUrl: URL;

    if (pathname === "/" || pathname === "") {
      // Root → user's public page
      rewriteUrl = new URL(`/${username}`, req.url);
    } else if (segments.length === 1) {
      // Single segment → link redirect (e.g. /my-slug → /username/my-slug)
      rewriteUrl = new URL(`/${username}/${segments[0]}`, req.url);
    } else {
      // Multi-segment paths → 404 (block /dashboard etc. on custom domains)
      return new NextResponse(null, { status: 404 });
    }

    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("x-custom-domain", host);
    response.headers.set("x-next-i18n-router-locale", defaultLocale);
    return response;
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  const { userId } = await auth();

  const isAuthRoute =
    req.nextUrl.pathname === "/" ||
    req.nextUrl.pathname.startsWith("/sign-in") ||
    req.nextUrl.pathname.startsWith("/sign-up") ||
    req.nextUrl.pathname.startsWith("/update-password");

  if (isAuthRoute && userId != null) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const response = NextResponse.next();
  response.headers.set("x-next-i18n-router-locale", defaultLocale);
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
