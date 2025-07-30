import { NextRequest, NextResponse } from 'next/server';
import DriversCache from '../../../lib/driversCache';

export async function GET(request: NextRequest) {
  try {
    const cache = DriversCache.getInstance();
    const stats = await cache.getStatistics();

    return NextResponse.json({
      success: true,
      stats
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
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
