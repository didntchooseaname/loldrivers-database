import { NextRequest, NextResponse } from 'next/server';
import DriversCache from '../../../../lib/driversCache';

export async function POST(request: NextRequest) {
  try {
    // Vérification de sécurité pour les appels de cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Refreshing cache...');
    
    const cache = DriversCache.getInstance();
    
    // Vider le cache et recharger les données
    cache.clearCache();
    await cache.loadDrivers();
    await cache.getStatistics();
    
    console.log('Cache refreshed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Cache refreshed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cache refresh error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cache refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET pour permettre les appels manuels
export async function GET() {
  return POST(new Request('http://localhost/api/cache/refresh', { method: 'POST' }) as NextRequest);
}
