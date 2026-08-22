import { NextResponse } from 'next/server';
import { currentDeepWebUser, playerDeepWebItemsCollection } from '@/lib/deepwebServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentDeepWebUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await playerDeepWebItemsCollection();
    const docs = await col.find({ ownerId: me.id }).sort({ purchasedAt: -1 }).toArray();
    return NextResponse.json({ success: true, items: docs.map(({ _id, ...i }: any) => i) });
  } catch (error) {
    console.error('Error listando mis compras de la Deep Web:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
