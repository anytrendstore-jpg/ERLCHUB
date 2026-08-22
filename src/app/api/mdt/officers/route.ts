import { NextResponse } from 'next/server';
import { currentMDTUser, mdtOfficersCollection } from '@/lib/mdtServer';

export const dynamic = 'force-dynamic';

/** Lista de oficiales en servicio (para el resumen operativo del dashboard). */
export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const col = await mdtOfficersCollection();
    const docs = await col.find({ onDuty: true }).toArray();
    return NextResponse.json({ success: true, officers: docs.map(({ _id, ...o }: any) => o) });
  } catch (error) {
    console.error('Error listando oficiales:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
