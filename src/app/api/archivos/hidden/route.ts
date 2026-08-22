import { NextResponse } from 'next/server';
import { currentArchivosUser, archivosHiddenCollection } from '@/lib/archivosServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentArchivosUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await archivosHiddenCollection();
    const docs = await col.find({ discordId: me.id }).toArray();
    return NextResponse.json({ success: true, hidden: docs.map(({ _id, ...h }: any) => h) });
  } catch (error) {
    console.error('Error listando papelera:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
