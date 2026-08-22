import { NextResponse } from 'next/server';
import { currentPropertiesUser, playerPropertiesCollection } from '@/lib/propertiesServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentPropertiesUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await playerPropertiesCollection();
    const docs = await col.find({ ownerId: me.id }).sort({ purchasedAt: -1 }).toArray();
    return NextResponse.json({ success: true, properties: docs.map(({ _id, ...p }: any) => p) });
  } catch (error) {
    console.error('Error listando mis propiedades:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
