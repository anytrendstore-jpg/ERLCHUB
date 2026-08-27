import { NextRequest, NextResponse } from 'next/server';
import { currentMDTUser, mdtCallsCollection } from '@/lib/mdtServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

async function requireAccess() {
  const user = await currentMDTUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 }) };
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 }) };
  return { user };
}

/**
 * Lee el mismo `mdt_calls` que usa el CAD de LSPD (log de incidentes de toda
 * la ciudad, alimentado por Emergency911App), pero filtrado a `faction:
 * 'Bomberos'` — LSFD nunca ve ni puede tocar incidentes de policía.
 */
export async function GET() {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const col = await mdtCallsCollection();
    const docs = await col.find({ faction: 'Bomberos' }).sort({ createdAt: -1 }).limit(300).toArray();
    return NextResponse.json({ success: true, calls: docs.map(({ _id, ...c }: any) => c) });
  } catch (error) {
    console.error('Error listando incidentes de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await mdtCallsCollection();
    const existing = await col.findOne({ id });
    if (!existing) return NextResponse.json({ success: false, error: 'Incidente no encontrado' }, { status: 404 });
    if (existing.faction !== 'Bomberos') return NextResponse.json({ success: false, error: 'Ese incidente no es de LSFD' }, { status: 403 });

    await col.updateOne({ id }, { $set: { ...updates, updatedAt: new Date() } });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    return NextResponse.json({ success: true, call: clean });
  } catch (error) {
    console.error('Error actualizando incidente de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
