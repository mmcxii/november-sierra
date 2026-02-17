import i18nConfig from "@/lib/i18n/config";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { i18nRouter } from "next-i18n-router";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default clerkMiddleware((_auth, request: NextRequest) => {
  const i18nResponse = i18nRouter(request, i18nConfig);

  if (i18nResponse) {
    return i18nResponse;
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
