import type { NextConfig } from "next";

import { securityHeaders } from "./lib/security-headers";

const nextConfig: NextConfig = {
  // Required by the Dockerfile: it copies .next/standalone, which Next only
  // emits when output is "standalone".
  output: "standalone",
  // Image optimization is not used for remote hosts. No `remotePatterns` means
  // /_next/image refuses arbitrary external URLs, closing the open image proxy.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders],
      },
    ];
  },
  reactStrictMode: true,
};

export default nextConfig;
