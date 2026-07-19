import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/ui', '@repo/api-client', '@repo/api-types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'villa-timtavio-monorepo-pwa.vercel.app' },
      { protocol: 'https', hostname: 'www.villatimtavio.com' },
      { protocol: 'https', hostname: 'villatimtavio.com' },
    ],
  },
};

// next-pwa injects a webpack config, which Next 16 rejects under Turbopack
// (the dev/build default). The service worker is only needed for production,
// so wrap with next-pwa there only — dev runs clean on Turbopack, and the
// production build uses webpack (see the `build` script: `next build --webpack`).
function buildConfig(): NextConfig {
  if (process.env.NODE_ENV !== 'production') return nextConfig;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  // next-pwa@5.6.0 API: Workbox GenerateSW options live at the top level
  // (not nested under `workboxOptions`, which is the @ducanh2912 fork's shape).
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    cacheOnFrontEndNav: true,
    reloadOnOnline: true,
    disableDevLogs: true,
  });
  return withPWA(nextConfig);
}

export default buildConfig();
