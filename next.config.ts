import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  cacheComponents: true,
  typedRoutes: true,
  images: {
    qualities: [75, 100],
    minimumCacheTTL: 2592000, // 30 days
    remotePatterns: [
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "opengraph.githubassets.com" },
      { hostname: "raw.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
