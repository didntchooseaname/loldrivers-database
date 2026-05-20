import DriversClient from '@/components/DriversClient';
import DriversCache from '@/lib/driversCache';

export const dynamic = 'force-dynamic';

// Only load the first page of drivers for SSR (20 items instead of all ~2000+)
const SSR_PAGE_SIZE = 20;

export default async function HomePage() {
  const cache = DriversCache.getInstance();

  try {
    const [initialDrivers, initialStats] = await Promise.all([
      cache.getDrivers(1, SSR_PAGE_SIZE),
      cache.getStatistics()
    ]);

    return (
      <DriversClient
        initialDrivers={{
          success: true,
          ...initialDrivers
        }}
        initialStats={{
          success: true,
          stats: initialStats
        }}
      />
    );
  } catch (error) {
    console.error('SSR Error:', error);

    return (
      <div className="container">
        <div className="error-message">
          <h1>Error Loading Drivers Database</h1>
          <p>We&apos;re experiencing technical difficulties. Please try again later.</p>
          <p className="error-details">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}

// SEO metadata inherited from layout.tsx (title template, OG, JSON-LD, etc.)
