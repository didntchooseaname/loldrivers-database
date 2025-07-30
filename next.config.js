/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour Vercel
  env: {
    CACHE_TTL: '3600', // 1 heure en secondes
  },
  // Optimisation des images
  images: {
    unoptimized: true,
  },
  // Headers pour le cache
  async headers() {
    return [
      {
        source: '/api/drivers',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400', // Cache 1h, stale 24h
          },
        ],
      },
      {
        source: '/api/drivers/search',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=3600', // Cache 5min, stale 1h
          },
        ],
      },
    ];
  },
  // Compression
  compress: true,
  // Configuration pour les gros fichiers JSON
  webpack: (config) => {
    // Modern webpack already handles JSON files properly
    // Remove the custom JSON rule as it's redundant
    return config;
  },
};

module.exports = nextConfig;
