import { NextRequest, NextResponse } from 'next/server';
import DriversCache from '../../../lib/driversCache';

// In-memory API response cache
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(url: string): string {
  return url;
}

function getFromCache(key: string) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: unknown) {
  apiCache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  // Nettoyage automatique du cache
  if (apiCache.size > 100) {
    const oldestKey = apiCache.keys().next().value;
    apiCache.delete(oldestKey);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Clear cache if requested
    if (searchParams.get('clearCache') === 'true') {
      apiCache.clear();
      return NextResponse.json({ success: true, message: 'Cache cleared' });
    }
    
    const cacheKey = getCacheKey(request.url);
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
    // Allow unlimited results if limit is set to 0 or -1
    const actualLimit = limit <= 0 ? undefined : Math.min(50000, Math.max(1, limit));
    const query = searchParams.get('q') || '';
    
    // Optimized filters
    const filters: Record<string, boolean | string> = {};
    if (searchParams.get('hvci') === 'true') filters.hvci = true;
    if (searchParams.get('killer') === 'true') filters.killer = true;
    if (searchParams.get('recent') === 'true') filters.recent = true;
    if (searchParams.get('newest-first') === 'true') filters.newestFirst = true;
    if (searchParams.get('oldest-first') === 'true') filters.oldestFirst = true;
    
    // Nouveaux filtres comportementaux
    if (searchParams.get('memory-manipulator') === 'true') filters.memoryManipulator = true;
    if (searchParams.get('process-killer') === 'true') filters.processKiller = true;
    if (searchParams.get('debug-bypass') === 'true') filters.debugBypass = true;
    if (searchParams.get('registry-manipulator') === 'true') filters.registryManipulator = true;
    if (searchParams.get('file-manipulator') === 'true') filters.fileManipulator = true;
    
    // Filtres par architecture
    const architecture = searchParams.get('architecture');
    if (architecture && ['AMD64', 'I386', 'ARM64'].includes(architecture)) {
      filters.architecture = architecture;
    }
    
    // Certificate filters - mutual exclusion
    const trustedCertParam = searchParams.get('trusted-cert');
    const untrustedCertParam = searchParams.get('untrusted-cert');
    
    if (trustedCertParam === 'true' && untrustedCertParam === 'true') {
      // If both are present, prioritize trusted-cert
      filters.trustedCert = true;
    } else if (trustedCertParam === 'true') {
      filters.trustedCert = true;
    } else if (untrustedCertParam === 'true') {
      filters.untrustedCert = true;
    }

    const cache = DriversCache.getInstance();
    
    let result;
    if (query || Object.keys(filters).length > 0) {
      result = await cache.searchDrivers(query, filters, page, actualLimit);
    } else {
      result = await cache.getDrivers(page, actualLimit);
    }

    const response = {
      success: true,
      ...result
    };

    // Cache the response
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
