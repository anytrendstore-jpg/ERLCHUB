import { NextRequest, NextResponse } from 'next/server';
import { countActive } from '@/lib/presenceServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get('page');
  if (!page) return NextResponse.json({ success: false, error: 'Falta page' }, { status: 400 });
  const count = await countActive(page);
  return NextResponse.json({ success: true, count });
}
