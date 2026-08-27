import { NextResponse } from 'next/server';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdFirefightersCollection } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

/** Roster completo de LSFD (para el panel de Personal). */
export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const access = await checkFactionAccess(user.id, 'LSFD');
    if (!access.allowed) return NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 });

    const col = await fdFirefightersCollection();
    const docs = await col.find({}).toArray();
    return NextResponse.json({ success: true, personnel: docs.map(({ _id, ...p }: any) => p) });
  } catch (error) {
    console.error('Error listando personal de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
