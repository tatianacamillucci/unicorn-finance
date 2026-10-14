import type { NextConfig } from "next";

// script-src keeps 'unsafe-inline': a nonce-based CSP would require the
// whole app to opt out of static rendering (PPR/cacheComponents), since a
// nonce baked into a cached page's HTML would mismatch the fresh nonce on
// each request's CSP header and get blocked by the browser. Given this app
// loads no third-party scripts and never uses dangerouslySetInnerHTML
// (React auto-escapes all user text), the residual XSS risk is low —
// not worth trading away static caching across the whole site for it.
// 'unsafe-eval' only in development: React's dev tooling needs eval() to
// rebuild call stacks. Production never uses eval and keeps it blocked.
const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  cacheComponents: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Overrides Vercel's default "*" on prerendered content: this app
          // has no public API meant to be read cross-origin. "*" is invalid
          // together with credentials anyway, but an explicit narrow value
          // is clearer than relying on that spec detail.
          {
            key: "Access-Control-Allow-Origin",
            value: "https://unicorn-finance.vercel.app",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
