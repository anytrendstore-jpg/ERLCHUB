import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  createSessionToken,
  currentDiscordUser,
  isStaffDiscordUser,
  isStaffSession,
  STAFF_COOKIE,
} from '@/lib/whitelistServer';
import { logStaffAction } from '@/lib/staffServer';

export const dynamic = 'force-dynamic';

const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'erlchub-staff';

export async function GET() {
  const byDiscord = isStaffDiscordUser();
  const user = currentDiscordUser();

  return NextResponse.json({
    success: true,
    authenticated: isStaffSession(),
    // 'discord' = entra directo por su cuenta; 'password' = tuvo que escribirla
    via: byDiscord ? 'discord' : isStaffSession() ? 'password' : null,
    staffUser: byDiscord && user ? { id: user.id, name: user.global_name || user.username } : null,
  });
}

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  const given = Buffer.from(String(password || ''));
  const expected = Buffer.from(STAFF_PASSWORD);
  const ok = given.length === expected.length && crypto.timingSafeEqual(given, expected);

  if (!ok) {
    return NextResponse.json({ success: false, error: 'Contraseña incorrecta' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(STAFF_COOKIE, createSessionToken('staff'), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  await logStaffAction({
    type: 'login',
    category: 'SYSTEM',
    actor: 'Demo Staff',
    description: 'Demo Staff inició sesión en el panel (contraseña)',
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(STAFF_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
