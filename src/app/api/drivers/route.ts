import { NextRequest, NextResponse } from 'next/server';
import DriversCache from '@/lib/driversCache';
import { toSummary } from '@/lib/driver-model';
import { serverFiltersFromParams } from '@/lib/filters';
import type { Driver } from '@/types';

const MAX_PAGE_SIZE = 100;

// In-memory API response cache with TTL
const apiCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getFromCache(key: string) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  if (cached) apiCache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  // Evict oldest entry when cache grows too large
  if (apiCache.size > 100) {
    const firstKey = apiCache.keys().next().value;
    if (firstKey) apiCache.delete(firstKey);
  }
  apiCache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const cacheKey = request.url;
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult, {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
          'X-Cache': 'HIT'
        }
      });
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = parseInt(searchParams.get('limit') || '20', 10) || 20;
    const actualLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, limit));
    const query = searchParams.get('q') || '';

    const filters = serverFiltersFromParams(searchParams);

    const driverCache = DriversCache.getInstance();

    let result: { drivers: Driver[]; total: number; hasMore: boolean };
    if (query || Object.keys(filters).length > 0) {
      result = (await driverCache.searchDrivers(query, filters, page, actualLimit)) as typeof result;
    } else {
      result = await driverCache.getDrivers(page, actualLimit);
    }

    const response = { success: true, ...result, drivers: result.drivers.map(toSummary) };
    setCache(cacheKey, response);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
