import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  typedRoutes: true,
  partialPrefetching: true,
  experimental: {
    useOffline: true,
    useTypeScriptCli: true,
    turbopackRustReactCompiler: true,
  },
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
