import { envSchema } from "@/lib/env";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = envSchema.NEXT_PUBLIC_APP_URL;

  return [
    { lastModified: new Date(), url: baseUrl },
    { lastModified: new Date(), url: `${baseUrl}/legal/privacy` },
    { lastModified: new Date(), url: `${baseUrl}/legal/terms` },
    { lastModified: new Date(), url: `${baseUrl}/pricing` },
  ];
}
