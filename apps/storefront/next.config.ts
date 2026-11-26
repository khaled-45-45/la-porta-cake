import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * Security headers for every response. The Content-Security-Policy only uses directives
 * that do not restrict scripts or styles (framing, base URL, form targets, plugins), so it
 * works with statically generated pages. A script policy needs per-request nonces and is
 * planned with the Phase 7 launch work. `scripts/check-routes.mjs` checks these headers.
 */
export const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The domain package ships TypeScript source; Next compiles it.
  transpilePackages: ['@la-porta/domain'],
  experimental: {
    serverActions: {
      // The only server action is the custom-order form: about 1,200 characters of
      // text at most. 32 KB leaves room for Arabic text (several bytes per character)
      // and form encoding, and refuses anything larger before it is parsed.
      bodySizeLimit: '32kb',
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
