import { NextResponse } from 'next/server';
import { currentPropertiesUser, ensurePropertiesSeeded } from '@/lib/propertiesServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentPropertiesUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await ensurePropertiesSeeded();
    const docs = await col.find({}).toArray();
    return NextResponse.json({ success: true, listings: docs.map(({ _id, ...l }: any) => l) });
  } catch (error) {
    console.error('Error listando propiedades:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
