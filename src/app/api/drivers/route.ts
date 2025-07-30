import { NextRequest, NextResponse } from 'next/server';
import DriversCache from '../../../lib/driversCache';

// Cache des réponses API en mémoire
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = parseInt(searchParams.get('limit') || '50');
    // Allow unlimited results if limit is set to 0 or -1
    const actualLimit = limit <= 0 ? undefined : Math.min(50000, Math.max(1, limit));
    const query = searchParams.get('q') || '';
    
    // Filtres optimisés
    const filters: Record<string, boolean> = {};
    if (searchParams.get('hvci') === 'true') filters.hvci = true;
    if (searchParams.get('killer') === 'true') filters.killer = true;
    if (searchParams.get('recent') === 'true') filters.recent = true;
    if (searchParams.get('newest-first') === 'true') filters.newestFirst = true;
    if (searchParams.get('oldest-first') === 'true') filters.oldestFirst = true;
    
    // Exclusion mutuelle pour signed/unsigned
    const signedParam = searchParams.get('signed');
    const unsignedParam = searchParams.get('unsigned');
    
    if (signedParam === 'true' && unsignedParam === 'true') {
      // Si les deux sont présents, on privilégie signed
      filters.signed = true;
    } else if (signedParam === 'true') {
      filters.signed = true;
    } else if (unsignedParam === 'true') {
      filters.unsigned = true;
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

    // Mise en cache de la réponse
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
