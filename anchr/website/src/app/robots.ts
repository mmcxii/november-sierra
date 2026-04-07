import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      disallow: ["/dashboard", "/onboarding", "/welcome", "/api", "/sign-in", "/sign-up"],
      userAgent: "*",
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
