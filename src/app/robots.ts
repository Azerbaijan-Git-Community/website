import type { MetadataRoute } from "next";
import { clientEnv } from "@/lib/env.client";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${clientEnv.NEXT_PUBLIC_BASE_URL}/sitemap.xml`,
  };
}
