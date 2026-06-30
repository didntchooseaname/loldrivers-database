import DriversClient from '@/components/DriversClient';
import DriversCache from '@/lib/driversCache';
import { parseFiltersFromURL } from '@/lib/filters';

export const dynamic = 'force-dynamic';

// Only load the first page of drivers for SSR (20 items instead of all ~2000+)
const SSR_PAGE_SIZE = 20;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const cache = DriversCache.getInstance();

  // Derive the initial UI state from the request URL so the server and the first
  // client render are identical (prevents hydration mismatches on filter/search state).
  const sp = await searchParams;
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) value.forEach((v) => usp.append(key, v));
    else if (value != null) usp.set(key, value);
  }
  const parsed = parseFiltersFromURL(usp);
  const initialUiParams = {
    searchQuery: parsed.searchQuery,
    activeFilters: Array.from(parsed.activeFilters),
    currentPage: parsed.currentPage,
  };

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
        initialUiParams={initialUiParams}
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
