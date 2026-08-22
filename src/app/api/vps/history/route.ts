import { NextResponse } from 'next/server';
import { currentVpsUser, vpsSubscriptionsCollection } from '@/lib/vpsServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentVpsUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await vpsSubscriptionsCollection();
    const docs = await col.find({ discordId: me.id }).sort({ purchasedAt: -1 }).limit(50).toArray();
    return NextResponse.json({ success: true, subscriptions: docs.map(({ _id, ...s }: any) => s) });
  } catch (error) {
    console.error('Error listando historial de VPS:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
