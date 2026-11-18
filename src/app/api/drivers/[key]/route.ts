import { NextResponse } from 'next/server';
import DriversCache from '@/lib/driversCache';

const KEY_PATTERN = /^[A-Za-z0-9_.-]{1,128}$/;

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!KEY_PATTERN.test(key)) {
    return NextResponse.json({ success: false, error: 'Invalid driver key' }, { status: 400 });
  }

  const driver = await DriversCache.getInstance().getDriverByKey(key);
  if (!driver) {
    return NextResponse.json({ success: false, error: 'Driver not found' }, { status: 404 });
  }

  return NextResponse.json(
    { success: true, driver },
    { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } },
  );
}
