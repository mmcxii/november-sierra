import type { NextConfig } from "next";
import { envSchema } from "./src/lib/env";

const nextConfig: NextConfig = {
  /* config options here */
  env: envSchema,
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "utfs.io" },
      { hostname: "*.ufs.sh" },
      { hostname: "**" }, // Nostr avatars from any domain
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
