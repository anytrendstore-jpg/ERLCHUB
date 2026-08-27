import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { currentMDTUser } from '@/lib/mdtServer';
import { fdMutualAidCollection, logFDAudit } from '@/lib/fdServer';
import { checkFactionAccess } from '@/lib/factionsServer';

export const dynamic = 'force-dynamic';

async function requireAccess() {
  const user = await currentMDTUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Sin sesión' }, { status: 401 }) };
  const access = await checkFactionAccess(user.id, 'LSFD');
  if (!access.allowed) return { error: NextResponse.json({ success: false, error: 'No sos miembro activo de LSFD' }, { status: 403 }) };
  return { user };
}

/** Mutual Aid — asistencia solicitada a otra agencia durante un incidente mayor. La agencia es texto libre (no hay otro FD en el sistema para referenciar). */
export async function GET() {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;

  try {
    const col = await fdMutualAidCollection();
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, requests: docs.map(({ _id, ...r }: any) => r) });
  } catch (error) {
    console.error('Error listando solicitudes de mutual aid de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user } = ctx;

  try {
    const body = await request.json();
    if (!body.agency?.trim() || !body.reason?.trim()) {
      return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }

    const col = await fdMutualAidCollection();
    const count = await col.countDocuments();
    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      requestNumber: `FD-MA-${1000 + count + 1}`,
      agency: String(body.agency).trim().slice(0, 100),
      reason: String(body.reason).trim().slice(0, 500),
      callId: body.callId || undefined,
      status: 'Requested' as const,
      requestedById: user.id,
      requestedByName: user.displayName,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(doc as any);
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'log_mutual_aid', description: `Mutual aid solicitada: ${doc.requestNumber} — ${doc.agency}` });
    return NextResponse.json({ success: true, request: doc });
  } catch (error) {
    console.error('Error registrando mutual aid de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo crear' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAccess();
  if ('error' in ctx) return ctx.error;
  const { user } = ctx;

  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'Falta el id' }, { status: 400 });

    const col = await fdMutualAidCollection();
    const set: Record<string, unknown> = { ...updates, updatedAt: new Date() };
    if ((updates.status === 'Completed' || updates.status === 'Cancelled') && !updates.resolvedAt) set.resolvedAt = new Date();

    await col.updateOne({ id }, { $set: set });
    const fresh = await col.findOne({ id });
    const { _id, ...clean } = fresh as any;
    logFDAudit({ firefighterId: user.id, firefighterName: user.displayName, action: 'update_mutual_aid', description: `Mutual aid actualizada: ${clean.requestNumber || id}` });
    return NextResponse.json({ success: true, request: clean });
  } catch (error) {
    console.error('Error actualizando mutual aid de LSFD:', error);
    return NextResponse.json({ success: false, error: 'No se pudo actualizar' }, { status: 500 });
  }
}
