import { NextRequest, NextResponse } from 'next/server';
import { recordPresence } from '@/lib/presenceServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, page } = await request.json();
    if (!sessionId || !page) return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    await recordPresence(String(sessionId).slice(0, 64), String(page).slice(0, 64));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
