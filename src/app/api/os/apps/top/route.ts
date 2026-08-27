import { NextResponse } from 'next/server';
import { osUserPreferencesCollection, currentOSUserId } from '@/lib/osServer';

export const dynamic = 'force-dynamic';

/** Ranking real de apps más instaladas — agregado sobre os_user_preferences, nunca un puntaje/reseña inventado. */
export async function GET() {
  const discordId = await currentOSUserId();
  if (!discordId) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await osUserPreferencesCollection();
    const rows = await col.aggregate<{ _id: string; count: number }>([
      { $unwind: '$installedApps' },
      { $match: { installedApps: { $ne: 'hubstore' } } },
      { $group: { _id: '$installedApps', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]).toArray();

    return NextResponse.json({ success: true, ranking: rows.map((r) => ({ appId: r._id, count: r.count })) });
  } catch (error) {
    console.error('Error calculando apps más instaladas:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
