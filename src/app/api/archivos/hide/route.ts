import { NextRequest, NextResponse } from 'next/server';
import { currentArchivosUser, archivosHiddenCollection, type ArchivoItemType } from '@/lib/archivosServer';

export const dynamic = 'force-dynamic';

/** Mueve un elemento a la Papelera (no borra el objeto real subyacente — sigue existiendo). */
export async function POST(request: NextRequest) {
  const me = await currentArchivosUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { itemType, itemId } = await request.json() as { itemType: ArchivoItemType; itemId: string };
    if (!itemType || !itemId) return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });

    const col = await archivosHiddenCollection();
    await col.updateOne(
      { discordId: me.id, itemType, itemId },
      { $set: { discordId: me.id, itemType, itemId, permanent: false, hiddenAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moviendo a la papelera:', error);
    return NextResponse.json({ success: false, error: 'No se pudo mover a la papelera' }, { status: 500 });
  }
}

/** action: 'restore' (vuelve a aparecer en su carpeta) | 'permanent' (deja de listarse incluso en la Papelera). */
export async function PATCH(request: NextRequest) {
  const me = await currentArchivosUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const { itemType, itemId, action } = await request.json() as { itemType: ArchivoItemType; itemId: string; action: 'restore' | 'permanent' };
    const col = await archivosHiddenCollection();

    if (action === 'restore') {
      await col.deleteOne({ discordId: me.id, itemType, itemId });
    } else if (action === 'permanent') {
      await col.updateOne({ discordId: me.id, itemType, itemId }, { $set: { permanent: true } });
    } else {
      return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando papelera:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
