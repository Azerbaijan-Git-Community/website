import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  cacheComponents: true,
  typedRoutes: true,
  images: {
    qualities: [75, 100],
    remotePatterns: [{ hostname: "avatars.githubusercontent.com" }, { hostname: "opengraph.githubassets.com" }],
  },
};

export default nextConfig;
