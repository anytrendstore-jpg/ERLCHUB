import { NextResponse } from 'next/server';
import { currentVpsUser, resolveVpsState } from '@/lib/vpsServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentVpsUser();
  if (!me) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const sub = await resolveVpsState(me.id);
    return NextResponse.json({ success: true, subscription: sub });
  } catch (error) {
    console.error('Error leyendo estado del VPS:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
