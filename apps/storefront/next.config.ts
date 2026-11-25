import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The domain package ships TypeScript source; Next compiles it.
  transpilePackages: ['@la-porta/domain'],
};

export default withNextIntl(nextConfig);
