import DriversClient from '@/components/DriversClient';
import DriversCache from '@/lib/driversCache';
import { parseFiltersFromURL, serverFiltersFromParams } from '@/lib/filters';
import { toSummary } from '@/lib/driver-model';
import type { Driver, Stats } from '@/types';

export const dynamic = 'force-dynamic';

const SSR_PAGE_SIZE = 24;

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

  const filters = serverFiltersFromParams(usp);
  const driversPromise = parsed.searchQuery || Object.keys(filters).length > 0
    ? cache.searchDrivers(parsed.searchQuery, filters, parsed.currentPage, SSR_PAGE_SIZE) as Promise<{ drivers: Driver[]; total: number; hasMore: boolean }>
    : cache.getDrivers(parsed.currentPage, SSR_PAGE_SIZE);
  const data = await Promise.all([driversPromise, cache.getStatistics()]).catch((error) => {
    console.error('SSR error:', error);
    return null;
  });

  if (!data) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight">The driver catalog is unavailable</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The data source could not be loaded. Please retry in a moment.
        </p>
      </main>
    );
  }

  const [initialDrivers, initialStats] = data;
  return (
    <DriversClient
      initialDrivers={{ success: true, ...initialDrivers, drivers: initialDrivers.drivers.map(toSummary) }}
      initialStats={{ success: true, stats: initialStats as Stats }}
      initialUiParams={initialUiParams}
    />
  );
}
