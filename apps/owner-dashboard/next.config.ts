import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/ui', '@repo/api-client', '@repo/api-types'],
};

export default nextConfig;
