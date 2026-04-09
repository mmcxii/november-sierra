import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    BUILD_TIMESTAMP: new Date().toISOString(),
  },
  images: {
    remotePatterns: [{ hostname: "anchr.to" }],
  },
  reactCompiler: true,
};

export default nextConfig;
