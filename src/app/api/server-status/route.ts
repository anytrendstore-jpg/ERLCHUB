import { NextResponse } from 'next/server';
import { getERLCStatus, isERLCConfigured } from '@/lib/erlcServer';

export const dynamic = 'force-dynamic';

/**
 * Estado público del servidor (jugadores conectados) para el widget de la
 * home. Sin autenticación porque es información pública de marketing, pero
 * la Server-Key NUNCA sale de este endpoint — se queda en el servidor.
 */
export async function GET() {
  if (!isERLCConfigured()) {
    return NextResponse.json({ online: 0, max: 50 });
  }

  const result = await getERLCStatus();
  if (!result.ok) {
    return NextResponse.json({ online: 0, max: 50 });
  }

  return NextResponse.json({ online: result.data.CurrentPlayers || 0, max: result.data.MaxPlayers || 50 });
}
