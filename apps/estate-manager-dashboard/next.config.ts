import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@repo/ui',
    '@repo/dashboard-ui',
    '@repo/api-client',
    '@repo/api-types',
  ],
};

export default nextConfig;
