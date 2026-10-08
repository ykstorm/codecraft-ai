// The production address, as the README's "Live" link and the Open Graph url
// in app/layout.tsx already give it. metadataBase, the canonical, robots.txt
// and the sitemap all start from it.
export const SITE_URL = "https://codecraft-ai-tau.vercel.app";

// The public pages with a fixed path, for the sitemap. /playground/[id] is a
// dynamic route and the rest need a sign-in, so they are not listed.
export const SITEMAP_PATHS: string[] = ["/", "/playgrounds"];
