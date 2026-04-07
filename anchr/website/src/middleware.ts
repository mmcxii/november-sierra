import { rateLimitRequest } from "@/lib/api/rate-limit";
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
    const rows = await sql`
      SELECT username FROM users
      WHERE custom_domain = ${host}
        AND custom_domain_verified = true
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

export default clerkMiddleware(async (auth, req) => {
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

  const host = req.headers.get("host") ?? "";
  const appHosts = getAppHosts();
  const isAppHost = appHosts.size === 0 || appHosts.has(host);

  // Custom domain routing
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
