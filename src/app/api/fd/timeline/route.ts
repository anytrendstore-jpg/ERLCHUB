import { NextRequest, NextResponse } from 'next/server';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdIncidentTimelineCollection } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

/** Timeline de un incidente — solo lectura, alimentado server-side desde fd/calls y fd/command al mutar. */
export async function GET(request: NextRequest) {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 });

  const callId = request.nextUrl.searchParams.get('callId');
  if (!callId) return NextResponse.json({ success: false, error: 'Falta el incidente' }, { status: 400 });

  try {
    const col = await fdIncidentTimelineCollection();
    const docs = await col.find({ callId }).sort({ timestamp: 1 }).toArray();
    return NextResponse.json({ success: true, entries: docs.map(({ _id, ...e }: any) => e) });
  } catch (error) {
    console.error('Error listando timeline de incidente de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
