import { NextResponse } from 'next/server';
import { currentDealerUser, playerVehiclesCollection } from '@/lib/dealerServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentDealerUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await playerVehiclesCollection();
    const docs = await col.find({ ownerId: me.id }).sort({ purchasedAt: -1 }).toArray();
    return NextResponse.json({ success: true, vehicles: docs.map(({ _id, ...v }: any) => v) });
  } catch (error) {
    console.error('Error listando mis vehículos:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
