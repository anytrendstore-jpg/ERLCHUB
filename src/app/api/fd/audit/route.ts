import { NextResponse } from 'next/server';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdAuditCollection } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

/** Mismo nivel de mando que ya usa Administración/Comando/Academia — solo mando ve el registro de auditoría. */
const COMMAND_LEVEL = 4;

/** Solo lectura — no hay POST público a propósito (evita entradas forjadas desde el cliente), ver logFDAudit() en fdServer.ts. */
export async function GET() {
  const user = await currentMDTUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 });

  try {
    const access = await checkFactionAccess(user.id, 'LSFD');
    if (!access.allowed) return NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 });
    if ((access.rank?.level ?? 0) < COMMAND_LEVEL) {
      return NextResponse.json({ success: false, error: `Necesitás jerarquía de mando (nivel ${COMMAND_LEVEL}+) para ver la auditoría` }, { status: 403 });
    }

    const col = await fdAuditCollection();
    const docs = await col.find({}).sort({ timestamp: -1 }).limit(500).toArray();
    return NextResponse.json({ success: true, entries: docs.map(({ _id, ...e }: any) => e) });
  } catch (error) {
    console.error('Error listando auditoría de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}
