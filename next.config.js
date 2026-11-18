/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CACHE_TTL: '3600',
  },

  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  async redirects() {
    return [
      { source: '/changelog', destination: '/', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: '/api/drivers',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }],
      },
      {
        source: '/api/stats',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=1800, stale-while-revalidate=3600' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
