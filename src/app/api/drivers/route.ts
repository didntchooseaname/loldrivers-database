import { NextRequest, NextResponse } from 'next/server';
import DriversCache from '../../../lib/driversCache';

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

    // Clear cache if requested
    if (searchParams.get('clearCache') === 'true') {
      apiCache.clear();
      DriversCache.getInstance().clearCache();
      return NextResponse.json({ success: true, message: 'Cache cleared' });
    }

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
    const limit = parseInt(searchParams.get('limit') || '1000');
    const actualLimit = limit <= 0 ? undefined : Math.min(50000, Math.max(1, limit));
    const query = searchParams.get('q') || '';

    // Build filters object matching the indexed keys in DriversCache
    const filters: Record<string, boolean | string> = {};

    if (searchParams.get('hvci') === 'true') filters.hvci = true;
    if (searchParams.get('killer') === 'true') filters.killer = true;
    if (searchParams.get('recent') === 'true') filters.recent = true;
    if (searchParams.get('newest-first') === 'true') filters.newestFirst = true;
    if (searchParams.get('oldest-first') === 'true') filters.oldestFirst = true;

    // Behavioral filters
    if (searchParams.get('memory-manipulator') === 'true') filters.memoryManipulator = true;
    if (searchParams.get('process-killer') === 'true') filters.processKiller = true;
    if (searchParams.get('debug-bypass') === 'true') filters.debugBypass = true;
    if (searchParams.get('registry-manipulator') === 'true') filters.registryManipulator = true;
    if (searchParams.get('file-manipulator') === 'true') filters.fileManipulator = true;

    // Certificate validation filters (now functional)
    if (searchParams.get('cert-revoked') === 'true') filters.certRevoked = true;
    if (searchParams.get('cert-expired') === 'true') filters.certExpired = true;
    if (searchParams.get('cert-suspicious') === 'true') filters.certSuspicious = true;
    if (searchParams.get('cert-valid') === 'true') filters.certValid = true;
    if (searchParams.get('cert-missing') === 'true') filters.certMissing = true;

    // Architecture
    const architecture = searchParams.get('architecture');
    if (architecture && ['AMD64', 'I386', 'ARM64'].includes(architecture)) {
      filters.architecture = architecture;
    }

    // Trusted/Untrusted cert (mutual exclusion)
    const trustedCert = searchParams.get('trusted-cert');
    const untrustedCert = searchParams.get('untrusted-cert');
    if (trustedCert === 'true' && untrustedCert === 'true') {
      filters.trustedCert = true;
    } else if (trustedCert === 'true') {
      filters.trustedCert = true;
    } else if (untrustedCert === 'true') {
      filters.untrustedCert = true;
    }

    const driverCache = DriversCache.getInstance();

    let result;
    if (query || Object.keys(filters).length > 0) {
      result = await driverCache.searchDrivers(query, filters, page, actualLimit);
    } else {
      result = await driverCache.getDrivers(page, actualLimit);
    }

    const response = { success: true, ...result };
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
