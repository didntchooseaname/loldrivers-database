import { NextResponse } from 'next/server';
import DriversCache from '../../../lib/driversCache';

// Cache spécifique pour les statistiques
let statsCache: { data: unknown; timestamp: number } | null = null;
const STATS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  try {
    // Vérifier le cache en mémoire
    if (statsCache && Date.now() - statsCache.timestamp < STATS_CACHE_DURATION) {
      return NextResponse.json(statsCache.data, {
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          'X-Cache': 'HIT'
        }
      });
    }

    const cache = DriversCache.getInstance();
    const stats = await cache.getStatistics();

    const response = {
      success: true,
      stats
    };

    // Mise en cache
    statsCache = {
      data: response,
      timestamp: Date.now()
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Cache': 'MISS'
      }
    });

  } catch (error) {
    console.error('Stats API Error:', error);
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
