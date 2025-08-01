import { NextResponse } from 'next/server';
import { getHelpContent } from '@/lib/helpContent';

export async function GET() {
  try {
    const content = await getHelpContent();
    return NextResponse.json(content);
  } catch (error) {
    console.error('Error serving help content:', error);
    return NextResponse.json(
      { error: 'Failed to load help content' },
      { status: 500 }
    );
  }
}
