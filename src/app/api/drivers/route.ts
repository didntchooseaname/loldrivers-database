import { NextRequest, NextResponse } from 'next/server';
import DriversCache from '../../../lib/driversCache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const query = searchParams.get('q') || '';
    
    // Filtres
    const filters: any = {};
    if (searchParams.get('hvci')) filters.hvci = true;
    if (searchParams.get('killer')) filters.killer = true;
    if (searchParams.get('signed')) filters.signed = true;
    if (searchParams.get('unsigned')) filters.unsigned = true;

    const cache = DriversCache.getInstance();
    
    let result;
    if (query || Object.keys(filters).length > 0) {
      result = await cache.searchDrivers(query, filters, page, limit);
    } else {
      result = await cache.getDrivers(page, limit);
    }

    return NextResponse.json({
      success: true,
      ...result
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
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
