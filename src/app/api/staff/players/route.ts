import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requirePermission } from '@/lib/permissions/engine';

export const dynamic = 'force-dynamic';

/** Lista de jugadores registrados (colección `users`) para el módulo Jugadores. */
export async function GET(request: NextRequest) {
  const denied = await requirePermission('players.view');
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();

    const db = await connectToDatabase();
    const query: Record<string, unknown> = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ username: rx }, { global_name: rx }, { discordId: rx }];
    }

    const players = await db
      .collection('users')
      .find(query, {
        projection: {
          discordId: 1, username: 1, global_name: 1, avatar: 1,
          hubCoins: 1, membership: 1, whitelistFast: 1, createdAt: 1,
        },
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      success: true,
      players: players.map(({ _id, ...p }: any) => p),
      total: await db.collection('users').countDocuments({}),
    });
  } catch (error) {
    console.error('Error listando jugadores:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
