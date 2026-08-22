import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireStaff } from '@/lib/staffServer';

export const dynamic = 'force-dynamic';

/** Top jugadores por Hub Coins, para Directivos > Rankings. */
export async function GET() {
  const denied = requireStaff();
  if (denied) return denied;

  try {
    const db = await connectToDatabase();
    const top = await db
      .collection('users')
      .find({ hubCoins: { $gt: 0 } }, { projection: { discordId: 1, username: 1, global_name: 1, avatar: 1, hubCoins: 1, membership: 1 } })
      .sort({ hubCoins: -1 })
      .limit(25)
      .toArray();

    return NextResponse.json({ success: true, ranking: top.map(({ _id, ...u }: any) => u) });
  } catch (error) {
    console.error('Error calculando ranking:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
