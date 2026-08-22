import { NextRequest, NextResponse } from 'next/server';
import { currentArchivosUser, itemTransfersCollection, type ArchivoItemType } from '@/lib/archivosServer';

export const dynamic = 'force-dynamic';

/** Historial de transferencias de un objeto. Solo visible para quien participó en al menos un movimiento. */
export async function GET(request: NextRequest) {
  const me = await currentArchivosUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const itemType = request.nextUrl.searchParams.get('itemType') as ArchivoItemType | null;
    const itemId = request.nextUrl.searchParams.get('itemId');
    if (!itemType || !itemId) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });

    const col = await itemTransfersCollection();
    const docs = await col.find({ itemType, itemId }).sort({ transferredAt: -1 }).toArray();
    const involved = docs.some((d) => d.fromId === me.id || d.toId === me.id);
    if (docs.length > 0 && !involved) return NextResponse.json({ success: false, error: 'No tienes acceso a este historial' }, { status: 403 });

    return NextResponse.json({ success: true, history: docs.map(({ _id, ...h }: any) => h) });
  } catch (error) {
    console.error('Error leyendo historial de objeto:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
