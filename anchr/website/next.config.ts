import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    BUILD_TIMESTAMP: new Date().toISOString(),
  },
  images: {
    remotePatterns: [
      { hostname: "utfs.io" },
      { hostname: "*.ufs.sh" },
      { hostname: "**" }, // Nostr avatars from any domain
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
