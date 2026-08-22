import { NextResponse } from 'next/server';
import { currentCasinoUser, casinoBetsCollection } from '@/lib/casinoServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentCasinoUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await casinoBetsCollection();
    const bets = await col.find({ playerId: me.id }).sort({ createdAt: -1 }).limit(200).toArray();
    return NextResponse.json({ success: true, bets: bets.map(({ _id, ...b }: any) => b), me });
  } catch (error) {
    console.error('Error leyendo historial del casino:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
