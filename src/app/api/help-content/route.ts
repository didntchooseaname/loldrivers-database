import { NextResponse } from 'next/server';
import { getHelpContent } from '@/lib/helpContent';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    const content = await getHelpContent(type || undefined);
    return NextResponse.json(content);
  } catch (error) {
    console.error('Error serving help content:', error);
    return NextResponse.json(
      { error: 'Failed to load help content' },
      { status: 500 }
    );
  }
}
