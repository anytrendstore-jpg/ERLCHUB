import { NextResponse } from 'next/server';
import { currentDeepWebUser, ensureDeepWebSeeded } from '@/lib/deepwebServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentDeepWebUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const itemsCol = await ensureDeepWebSeeded();
    const items = await itemsCol.find({}).toArray();
    return NextResponse.json({ success: true, items: items.map(({ _id, ...i }: any) => i) });
  } catch (error) {
    console.error('Error listando catálogo de la Deep Web:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
