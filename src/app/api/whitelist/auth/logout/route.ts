import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/whitelistServer';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
