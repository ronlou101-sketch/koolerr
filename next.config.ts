import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    '/tracker': ['./docs/KOOLERR_MASTER_TRACKER.md'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent the app from being embedded in a frame on any origin.
          { key: 'X-Frame-Options', value: 'DENY' },
          // Stop browsers from sniffing the response MIME type.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Send origin only; omit path and query string in the Referer header.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Enforce HTTPS for 2 years and include subdomains.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Disable browser features not used by this application.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Block plugin content, base-tag injection, and framing.
          // script-src is intentionally omitted here — a full nonce-based CSP
          // is tracked separately and requires middleware integration.
          {
            key: 'Content-Security-Policy',
            value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
          },
        ],
      },
    ]
  },
}

export default nextConfig
