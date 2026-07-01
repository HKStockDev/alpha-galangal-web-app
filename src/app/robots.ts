import type { MetadataRoute } from "next";
import { getPublicMarketingBaseUrl } from "@/lib/public-marketing-base-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicMarketingBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/org/",
          "/onboarding/",
          "/login",
          "/reset-password",
          "/api/",
          "/m/formula/preview/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
