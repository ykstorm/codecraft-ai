import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";
import { authRoutes, protectedRoutes } from "@/routes";

// Everything is open except the API and the pages behind sign-in. The paths come
// from routes.ts, so a page added there is kept out of the index too.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...protectedRoutes, ...authRoutes],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
