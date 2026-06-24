import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required by the Dockerfile: it copies .next/standalone, which Next only
  // emits when output is "standalone".
  output: "standalone",
  images:{
    remotePatterns:[
      {
        protocol:"https",
        hostname:"*",
        port:'',
        pathname:"/**"
      }
    ]
  },
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // Cross-origin isolation — REQUIRED for WebContainers (SharedArrayBuffer).
          // Do not remove or loosen these.
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          // Defence-in-depth headers. CSP is intentionally omitted: a restrictive
          // policy breaks WebContainers (they need blob:, wasm, and worker-src),
          // and COOP/COEP already provide strong isolation.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
        ],
      },
    ];
  },
  reactStrictMode:false
};

export default nextConfig;
