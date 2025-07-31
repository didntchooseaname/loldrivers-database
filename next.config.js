/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour Vercel
  env: {
    CACHE_TTL: '3600', // 1 heure en secondes
  },
  
  // Optimisations bundle améliorées
  experimental: {
    optimizePackageImports: ['react', 'react-dom', 'swr'],
    esmExternals: true,
  },
  
  // Optimisation des images
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Compression et optimisations
  compress: true,
  poweredByHeader: false,
  
  // Tree shaking optimisé
  webpack: (config, { dev, isServer }) => {
    // Optimisation pour la production
    if (!dev) {
      config.optimization.sideEffects = false;
      config.optimization.usedExports = true;
      
      // Optimisation CSS
      config.optimization.providedExports = true;
      config.optimization.minimize = true;
    }
    
    // Optimisation des chunks améliorée
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            enforce: true,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          swr: {
            test: /[\\/]node_modules[\\/]swr[\\/]/,
            name: 'swr',
            chunks: 'all',
            priority: 15,
            enforce: true,
          },
        },
      };
    }
    
    return config;
  },
  
  // Headers pour le cache optimisés
  async headers() {
    return [
      {
        source: '/api/drivers',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/api/stats',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=1800, stale-while-revalidate=3600',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
