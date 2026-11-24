import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The domain package ships TypeScript source; Next compiles it.
  transpilePackages: ['@la-porta/domain'],
};

export default nextConfig;
