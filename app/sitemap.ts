import type { MetadataRoute } from "next";

import { SITE_URL, SITEMAP_PATHS } from "@/lib/site";

// No lastModified, changeFrequency or priority: nothing here knows when a page
// last changed, and a made-up date is worse than none. The home URL has no
// trailing slash, to match the canonical Next writes for it.
export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_PATHS.map((path) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
  }));
}
